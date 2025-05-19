import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {map, Observable} from "rxjs";
import {CategoryType} from "../../../types/category.type";
import {environment} from "../../../environments/environment";
import {TypeType} from "../../../types/type.type";
import {CategoryWithTypeType} from "../../../types/category-with-type.type";

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {
  }

  getCategories(): Observable<CategoryType[]> {
    return this.http.get<CategoryType[]>(environment.api + 'categories');
  }

  //Сервис для получения типов и соединения их с категориями в одном массиве
  getCategoriesWithTypes(): Observable<CategoryWithTypeType[]> {
    return this.http.get<TypeType[]>(environment.api + 'types')
      .pipe(
        map((items: TypeType[]) => {
          //Создаём новый массив
          const array: CategoryWithTypeType[] = [];
          //Проходим циклом по каждому типу
          items.forEach((item: TypeType) => {

            //В переменную записываем совпадающие результаты поиска по категориям
            const foundItem = array.find(arrayItem => arrayItem.url === item.category.url);

            //Если элемент есть, то добавляем его в категорию
            if (foundItem) {
              foundItem.types.push({
                id: item.id,
                name: item.name,
                url: item.url,
              });
              //Если нет, то создаём эту категорию
            } else {
              array.push({
                id: item.category.id,
                name: item.category.name,
                url: item.category.url,
                types: [
                  {
                    id: item.id,
                    name: item.name,
                    url: item.url,
                  }
                ]
              });
            }
          });

          return array;
        })
      );
  }
}
