import {Injectable} from '@angular/core';
import {Observable, Subject, tap} from "rxjs";
import {environment} from "../../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {CartType} from "../../../types/cart.type";
import {DefaultResponseType} from "../../../types/default-response.type";

@Injectable({
  providedIn: 'root'
})
export class CartService {
  //Переменная для хранения актуального количества для хедера
  private count: number = 0;
  //Переменная Subject для отслеживания изменений количества товара
  count$: Subject<number> = new Subject<number>();

  constructor(private http: HttpClient) { }

  //Метод для изменения количества и оповещения об этом всех слушателей
  setCount(count: number) {
    this.count = count;
    this.count$.next(this.count);
  }

  getCart(): Observable<CartType | DefaultResponseType> {
    return this.http.get<CartType | DefaultResponseType>(environment.api + 'cart', {withCredentials: true});
  }

  getCartCount(): Observable<{count: number} | DefaultResponseType> {
    return this.http.get<{count: number} | DefaultResponseType>(environment.api + 'cart/count', {withCredentials: true})
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            this.setCount((data as {count: number}).count)
          }
        })
      );
  }

  updateCart(productId: string, quantity: number): Observable<CartType | DefaultResponseType> {
    return this.http.post<CartType | DefaultResponseType>(environment.api + 'cart', {productId, quantity}, {withCredentials: true})
      .pipe(
        tap(data => {
          if (!data.hasOwnProperty('error')) {
            //Создаём переменную для количества
            let count = 0;
            (data as CartType).items.forEach(item => {
              count += item.quantity;
            });
            //Передаём новое значение количества в метод изменения количества
            this.setCount(count);
          }
        })
      );
  }
}
