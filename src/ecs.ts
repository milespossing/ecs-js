import { v4 } from "uuid";
import * as R from "ramda";

export type Entity = string;

// might want some way to deal with these a bit easier
export interface IComponent {
  entityId: Entity;
  type: string;
}

export abstract class Component implements IComponent {
  entityId!: Entity;
  abstract type: string;
}

type ComponentContainer = Record<string, Record<Entity, IComponent>>;

export interface ISystem {
  name: string;
  execute: (world: IWorld) => Promise<SystemResult>;
}

export class ComponentSystem implements ISystem {
  name;
  getFunc;
  updateFunc;

  constructor(
    name: string,
    getComponents: (components: ComponentContainer) => IComponent[][],
    update: (components: IComponent[]) => Promise<void>
  ) {
    this.name = name;
    this.getFunc = getComponents;
    this.updateFunc = update;
  }

  execute: (world: IWorld) => Promise<SystemResult> = async (world) => {
    const components = this.getFunc(world.Components);
    await Promise.all(components.map(this.updateFunc));
    return new SystemResult();
  };
}

export class VoidSystem implements ISystem {
  name: string;
  func: any;
  constructor(name: string, func: (container: WorldContainer) => Promise<void>) {
    this.name = name;
    this.func = func;
  }

  execute: (world: IWorld) => Promise<SystemResult> = async () => {
    await this.func();
    return new SystemResult();
  };
}

export interface IWorld {
  Components: ComponentContainer;
  Entities: Entity[];
  Systems: ISystem[];
}

export class WorldContainer {
  World: IWorld;

  constructor(world: IWorld) {
    this.World = world;
  }

  addEntity: EntityBuilderFunc<void> = (func) => {
    const newEntity = v4();
    const builder = new EntityBuilder(newEntity);
    func(builder);
    this.World.Entities.push(newEntity);
    builder.components.forEach(c => this.addComponent(newEntity, c));
  };

  addComponent: (entity: Entity, component: IComponent) => void = (
    entity,
    component
  ) => {
    component.entityId = entity;
    this.World.Entities.push(entity);
    if (!this.World.Components[component.type])
      this.World.Components[component.type] = {};
    this.World.Components[component.type][entity] = component;
  };
}

type EntityBuilderFunc<T> = (
  builderFunc: (builder: IEntityBuilder) => void
) => T;

interface IEntityBuilder {
  WithComponent: (component: IComponent) => IEntityBuilder;
}

class EntityBuilder implements IEntityBuilder {
  entity: Entity;
  components: IComponent[];

  constructor(entity: Entity) {
    this.entity = entity;
    this.components = [];
  }

  WithComponent: (component: IComponent) => IEntityBuilder = (component) => {
    component.entityId = this.entity;
    this.components.push(component);
    return this;
  };
}

export class WorldBuilder implements IWorldBuilder {
  container: WorldContainer;

  constructor() {
    this.container = new WorldContainer({
      Components: {},
      Systems: [],
      Entities: [],
    });
  }

  WithEntity: EntityBuilderFunc<IWorldBuilder> = (func) => {
    this.container.addEntity(func);
    return this;
  };

  WithSystem: (system: ISystem) => IWorldBuilder = (system) => {
    this.container.World.Systems.push(system);
    return this;
  };

  Build: () => WorldContainer = () => {
    return this.container;
  };
}

export interface IWorldBuilder {
  Build: () => WorldContainer;
  WithSystem: (system: ISystem) => IWorldBuilder;
  WithEntity: EntityBuilderFunc<IWorldBuilder>;
}

export class SystemResult {
  StdOut: string = "";
  StdErr: string = "";
}

interface IStepResult {
  SystemResults: SystemResult[];
}

interface IWorldRunner {
  ExecuteStep: (world: IWorld) => Promise<IStepResult>;
}

export class WorldRunner implements IWorldRunner {
  ExecuteStep: (world: IWorld) => Promise<IStepResult> = async (world) => {
    const results = await Promise.all(
      world.Systems.map((system) => {
        system.execute(world);
      })
    );
    R.flatten(results);
    return { SystemResults: [] };
  };
}
