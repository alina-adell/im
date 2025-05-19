import {Component, OnInit} from '@angular/core';
import {ProductService} from "../../../shared/services/product.service";
import {ProductType} from "../../../../types/product.type";
import {CategoryService} from "../../../shared/services/category.service";
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {AppliedFilterType} from "../../../../types/applied-filter.type";
import {CartService} from "../../../shared/services/cart.service";
import {CartType} from "../../../../types/cart.type";
import {FavoriteService} from "../../../shared/services/favorite.service";
import {FavoriteType} from "../../../../types/favorite.type";
import {DefaultResponseType} from "../../../../types/default-response.type";
import {debounceTime} from "rxjs";
import {ActiveParamsUtil} from "../../../shared/utils/active-params.util";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {

  products: ProductType[] = [];
  categoriesWithTypes: CategoryWithTypeType[] = [];
  // Переменная для хранения массива выбранных типов для URL параметров
  activeParams: ActiveParamsType = {types: []};
  appliedFilters: AppliedFilterType[] = [];
  sortingOpen: boolean = false;
  sortingOptions: {name: string, value: string}[] = [
    {name: 'От А до Я', value: 'az-asc'},
    {name: 'От Я до А', value: 'az-desc'},
    {name: 'По возрастанию цены', value: 'price-asc'},
    {name: 'По убыванию цены', value: 'price-desc'},
  ];
  pages: number[] = [];
  //Переменная для обновления состояния добавленных в корзину товаров
  cart: CartType | null = null;
  favoriteProducts: FavoriteType[] | null = null;

  constructor(private productService: ProductService,
              private categoryService: CategoryService,
              private activatedRoute: ActivatedRoute,
              private cartService: CartService,
              private authService: AuthService,
              private favoriteService: FavoriteService,
              private router: Router) { }

  ngOnInit(): void {
    //Запрос на получение каталога выполняем в запросе на получение товаров корзины
    this.cartService.getCart()
      .subscribe((data: CartType | DefaultResponseType) => {
        if ((data as DefaultResponseType).error !== undefined) {
          throw new Error((data as DefaultResponseType).message);
        }

        this.cart = data as CartType;

        if (this.authService.getIsLoggedIn()) {
          //Получаем данные по избранным товарам
          this.favoriteService.getFavorites()
            .subscribe(
              {
                next: (data: FavoriteType[] | DefaultResponseType) => {
                  if ((data as DefaultResponseType).error !== undefined) {
                    const error = (data as DefaultResponseType).message;
                    //Вызываем эту функцию в любом случае
                    this.processCatalog();
                    throw new Error(error);
                  }

                  //При успешном запросе размещаем в локальную переменную данные об избранных товарах
                  this.favoriteProducts = data as FavoriteType[];
                  this.processCatalog();
                },
                error: (error) => {
                  this.processCatalog();
                },
              });
        } else {
          this.processCatalog();
        }
      });
  }

  processCatalog() {
    //Запрос категорий
    this.categoryService.getCategoriesWithTypes()
      .subscribe(data => {
        this.categoriesWithTypes = data;

        //Подписываемся на query параметры
        this.activatedRoute.queryParams
          //Задержка запросов на пол секунды, чтобы не отправлять их при каждом изменении значений инпутов
          .pipe(
            debounceTime(500),
          )
          .subscribe(params => {
            //Устанавливаем значения в массив activeParams через утилиту ActiveParamsUtil
            this.activeParams = ActiveParamsUtil.processParams(params);
            //Обнуляем массив
            this.appliedFilters = [];
            this.activeParams.types.forEach(url => {

              for (let i = 0; i < this.categoriesWithTypes.length; i++) {
                const foundType = this.categoriesWithTypes[i].types.find(type => type.url === url);
                if (foundType) {
                  this.appliedFilters.push({
                    name: foundType.name,
                    urlParam: foundType.url
                  });
                }
              }
            });
            //Проверяем наличие параметров высоты и диаметра и добавляем в массив, если они есть
            if (this.activeParams.heightFrom) {
              this.appliedFilters.push({
                name: 'Высота: от ' + this.activeParams.heightFrom + ' см',
                urlParam: 'heightFrom',
              });
            }
            if (this.activeParams.heightTo) {
              this.appliedFilters.push({
                name: 'Высота: до ' + this.activeParams.heightTo + ' см',
                urlParam: 'heightTo',
              });
            }
            if (this.activeParams.diameterFrom) {
              this.appliedFilters.push({
                name: 'Диаметр: от ' + this.activeParams.diameterFrom + ' см',
                urlParam: 'diameterFrom',
              });
            }
            if (this.activeParams.diameterTo) {
              this.appliedFilters.push({
                name: 'Диаметр: до ' + this.activeParams.diameterTo + ' см',
                urlParam: 'diameterTo',
              });
            }

            //Запрос на получение продуктов
            this.productService.getProducts(this.activeParams)
              .subscribe(data => {
                //Обнуляем массив страниц и циклом заполняем снова полученные страницы
                this.pages = [];
                for (let i = 1; i <= data.pages; i++) {
                  this.pages.push(i);
                }

                //Проверка наличия данных в cart и реализация отображения данных корзины в каталоге
                if (this.cart && this.cart.items.length > 0) {
                  //Создаём новый массив с учётом если есть данные в cart
                  this.products = data.items.map(product => {
                    if (this.cart) {
                      //Ищем совпадение товаров по id
                      const productInCart = this.cart.items.find(item => item.product.id === product.id);
                      //Если совпадения были, то добавляем их количество
                      if (productInCart) {
                        product.countInCart = productInCart.quantity;
                      }
                    }
                    return product;
                  });
                } else {
                  this.products = data.items;
                }

                if (this.favoriteProducts) {
                  //Записываем в массив тот же объект с изменением информации об избранных товарах
                  this.products = this.products.map(product => {
                    const productInFavorite = this.favoriteProducts?.find(item => item.id === product.id);
                    if (productInFavorite) {
                      product.isInFavorite = true;
                    }
                    return product;
                  });
                }
              });
          });
      });
  }

  removeAppliedFilter(appliedFilter: AppliedFilterType) {
    if (appliedFilter.urlParam === 'heightFrom' || appliedFilter.urlParam === 'heightTo' ||
      appliedFilter.urlParam === 'diameterFrom' || appliedFilter.urlParam === 'diameterTo') {
      delete this.activeParams[appliedFilter.urlParam];
    } else {
      //Удаляем тип из массива this.activeParams.types
      this.activeParams.types = this.activeParams.types.filter(item => item !== appliedFilter.urlParam);
    }

    this.activeParams.page = 1;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    }).then();
  }

  toggleSorting(): void {
    this.sortingOpen = !this.sortingOpen;
  }

  sort(value: string): void {
    this.activeParams.sort = value;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    }).then();
  }

  openPage(page: number): void {
    this.activeParams.page = page;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    }).then();
  }

  openPrevPage(): void {
    if (this.activeParams.page && this.activeParams.page > 1) {
      this.activeParams.page--;

      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      }).then();
    }
  }

  openNextPage(): void {
    if (this.activeParams.page && this.activeParams.page < this.pages.length) {
      this.activeParams.page++;

      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      }).then();
    }
  }

}
