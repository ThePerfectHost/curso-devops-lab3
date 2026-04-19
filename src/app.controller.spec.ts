import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService; // <-- Agregamos una variable para el servicio

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService); // <-- Instanciamos el servicio
  });

  describe('root', () => {
    
    // Prueba por defecto
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    // quise agregar un par de pruebas :)

    // validar el comportamiento (espía)
    it('debería llamar al método getHello del AppService', () => {
      // Creación de un "espia" que vigila el método getHello del servicio
      const spy = jest.spyOn(appService, 'getHello');
      appController.getHello();
      
      // Validamos que el controlador efectivamente utilizo dicho servicio
      expect(spy).toHaveBeenCalled();
    });

    // Agregue otro prueba para validar el tipo de dato que sea string por ejemplo
    it('debería retornar un string', () => {
      const result = appController.getHello();
      expect(typeof result).toBe('string');
    });

  });
});