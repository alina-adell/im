import {Params} from "@angular/router";
import {ActiveParamsType} from "../../../types/active-params.type";

export class ActiveParamsUtil {
  static processParams(params: Params): ActiveParamsType {
    //Переменная для хранения типов
    const activeParams: ActiveParamsType = {types: []};
    //Если параметры есть, то добавляем их в массив activeParams
    if (params.hasOwnProperty('types')) {
      //Также внутри проверяем, если один параметр это строка, то превращаем её в массив
      activeParams.types = Array.isArray(params['types']) ? params['types'] : [params['types']];
    }
    if (params.hasOwnProperty('heightTo')) {
      activeParams.heightTo = params['heightTo'];
    }
    if (params.hasOwnProperty('heightFrom')) {
      activeParams.heightFrom = params['heightFrom'];
    }
    if (params.hasOwnProperty('diameterTo')) {
      activeParams.diameterTo = params['diameterTo'];
    }
    if (params.hasOwnProperty('diameterFrom')) {
      activeParams.diameterFrom = params['diameterFrom'];
    }
    if (params.hasOwnProperty('sort')) {
      activeParams.sort = params['sort'];
    }
    if (params.hasOwnProperty('page')) {
      activeParams.page = +params['page'];
    }
    return activeParams;
  }
}
