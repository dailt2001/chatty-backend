import { Application, json, urlencoded, Response, Request, NextFunction } from 'express';

export class ChattyServer {
    private app: Application;

    constructor(app: Application){
        this.app = app
    }

    public start(): void{}

    private securityMiddleware(app: Application): void{}

    private standardMiddleware(app: Application): void{}

    private routeMiddleware(app: Application): void{}

    private globalErrorHandler(app: Application): void{}

    private import { useState } from "react";
    
    export default function useLocalStorage<T>(key: string, initialValue: T) {
      const [storedValue, setStoredValue] = useState<T>(() => {
        if (typeof window === "undefined") {
          return initialValue;
        }
        try {
          const item = window.localStorage.getItem(key);
          return item ? JSON.parse(item) : initialValue;
        } catch (error) {
          console.log(error);
          return initialValue;
        }
      });
      const setValue = (value: T | ((val: T) => T)) => {
        try {
          const valueToStore =
            value instanceof Function ? value(storedValue) : value;
          setStoredValue(valueToStore);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
        } catch (error) {
          console.log(error);
        }
      };
      return [storedValue, setValue] as const;
    }
    
}