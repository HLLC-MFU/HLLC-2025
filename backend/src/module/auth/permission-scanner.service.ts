import {
    Injectable,
    OnModuleInit,
    RequestMethod,
  } from '@nestjs/common';
  import {
    DiscoveryService,
    MetadataScanner,
    Reflector,
  } from '@nestjs/core';
  import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
  
  @Injectable()
  export class PermissionScannerService implements OnModuleInit {
    constructor(
      private readonly discoveryService: DiscoveryService,
      private readonly metadataScanner: MetadataScanner,
      private readonly reflector: Reflector,
    ) {}
  
    private readonly methodToActionMap = {
      [RequestMethod.GET]: 'read',
      [RequestMethod.POST]: 'create',
      [RequestMethod.PUT]: 'update',
      [RequestMethod.PATCH]: 'update',
      [RequestMethod.DELETE]: 'delete',
    };
  
    onModuleInit() {
      const controllers = this.discoveryService.getControllers();
      const permissions = new Set<string>();
  
      for (const wrapper of controllers) {
        const { instance, metatype } = wrapper;
  
        // ⚠️ Check null/undefined
        if (!instance || !metatype) continue;
  
        const controllerPath: string = Reflect.getMetadata(PATH_METADATA, metatype);
        if (typeof controllerPath !== 'string') continue;
  
        const prototype = Object.getPrototypeOf(instance);
        const methodNames = this.metadataScanner.getAllMethodNames(prototype);
  
        for (const methodName of methodNames) {
          const methodRef = prototype[methodName];
          const routePath = Reflect.getMetadata(PATH_METADATA, methodRef);
          const methodType: RequestMethod =
            Reflect.getMetadata(METHOD_METADATA, methodRef);
  
          const action = this.methodToActionMap[methodType];
          if (!action) continue;
  
          const permission = `${controllerPath.replace(/^\//, '')}:${action}`;
          permissions.add(permission);
        }
      }
  
      console.log('📍 Dynamic Permissions:', [...permissions]);
    }
  }
  