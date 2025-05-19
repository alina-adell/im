import {Component, Input, OnInit} from '@angular/core';
import {CategoryWithTypeType} from "../../../../types/category-with-type.type";
import {ActivatedRoute, Router} from "@angular/router";
import {ActiveParamsType} from "../../../../types/active-params.type";
import {ActiveParamsUtil} from "../../utils/active-params.util";

@Component({
  selector: 'category-filter',
  templateUrl: './category-filter.component.html',
  styleUrls: ['./category-filter.component.scss']
})
export class CategoryFilterComponent implements OnInit {

  @Input() categoryWithTypes: CategoryWithTypeType | null = null;
  @Input() type: string | null = null;
  //Переменная для хранения открытого закрытого меню типов
  open = false;
  // Переменная для хранения массива выбранных типов для URL параметров
  activeParams: ActiveParamsType = {types: []};
  //Переменные для хранения параметров размеров
  from: number | null = null;
  to: number | null = null;

  get title(): string {
    if (this.categoryWithTypes) {
      return this.categoryWithTypes.name
    } else if (this.type) {
      if (this.type === 'height') {
        return 'Высота';
      } else if (this.type === 'diameter') {
        return 'Диаметр';
      }
    }

    return '';
  }

  constructor(private router: Router,
              private activateRoute: ActivatedRoute,) { }

  ngOnInit(): void {
    //Подписываемся на изменение параметров URL
    this.activateRoute.queryParams.subscribe(params => {

      //Устанавливаем значения в массив activeParams через утилиту ActiveParamsUtil
      this.activeParams = ActiveParamsUtil.processParams(params);
      //Выполняем проверку на то, заполнены ли инпуты
      if (this.type) {
        if (this.type === 'height') {
          //Фильтр открыт если в инпутах есть значения
          this.open = !!(this.activeParams.heightFrom || this.activeParams.heightTo);
          this.from = this.activeParams.heightFrom ? +this.activeParams.heightFrom : null;
          this.to = this.activeParams.heightTo ? +this.activeParams.heightTo : null;

        } else if (this.type === 'diameter') {
          //Фильтр открыт если в инпутах есть значения
          this.open = !!(this.activeParams.diameterFrom || this.activeParams.diameterTo);
          this.from = this.activeParams.diameterFrom ? +this.activeParams.diameterFrom : null;
          this.to = this.activeParams.diameterTo ? +this.activeParams.diameterTo : null;
        }
      } else {
        this.activeParams.types = params['types'] ? (Array.isArray(params['types']) ? params['types'] : [params['types']]) : [];
        //Проверяем, есть ли активные типы в параметрах URL
        if (this.categoryWithTypes && this.categoryWithTypes.types
          && this.categoryWithTypes.types.length > 0 &&
          //Сравниваем массивы данных с массивом текущих параметров
          this.categoryWithTypes.types.some(type =>
            this.activeParams.types.find(item => type.url === item))) {
          this.open = true;
        }
      }
      // console.log(params);
    });
  }

  toggle(): void {
    this.open = !this.open;
  }

  updateFilterParam(url: string, checked: boolean): void {
    if (this.activeParams.types && this.activeParams.types.length > 0) {
      const existingTypeInParams = this.activeParams.types.find(item => item === url);
      if (existingTypeInParams && !checked) {
        //Если элемент есть и он не чекнут, удаляем его
        this.activeParams.types = this.activeParams.types.filter(item => item !== url);
      } else if (!existingTypeInParams && checked) {
        //Если элемента нет и он чекнут, добавляем в массив
        // this.activeParams.types.push(url); //- это баг при работе с query параметрами
        this.activeParams.types = [...this.activeParams.types, url];
      }
    } else if (checked) {
      //Если в массиве activeParams ничего ещё нет и элемент чекнут создаём массив с url
      this.activeParams.types = [url];
    }

    this.activeParams.page = 1;
    this.router.navigate(['/catalog'], {
      queryParams: this.activeParams
    }).then()
  }

  updateFilterParamFromTo(param: string, value: string): void {
    if (param === 'heightTo' || param === 'heightFrom' || param === 'diameterTo' || param === 'diameterFrom') {
      if (this.activeParams[param] && !value) {
        delete this.activeParams[param];
      } else {
        this.activeParams[param] = value;
      }

      this.activeParams.page = 1;
      this.router.navigate(['/catalog'], {
        queryParams: this.activeParams
      }).then()
    }
  }

}
