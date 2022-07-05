import { v4 } from 'uuid';
import * as R from 'ramda';

type Entity = string;

interface IComponent {
    entityId: number;
    type: string;
};

type ComponentContainer = Record<string, Record<Entity, IComponent>>;

export interface ISystem {
    name: string;
    execute: (world: IWorld) => Promise<SystemResult>;
};

export class ComponentSystem implements ISystem {
    name;
    getFunc;
    updateFunc;
    
    constructor(name: string, getComponents: (components: ComponentContainer) => IComponent[][], update: (components: IComponent[]) => Promise<void>){
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
    constructor(name: string, func: () => Promise<void>) {
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
        this.components.push(component);
        return this;
    }
}

export class WorldBuilder implements IWorldBuilder {
    Components: ComponentContainer;
    Systems: ISystem[];
    Entities: Entity[];

    constructor() {
        this.Components = {};
        this.Systems = [];
        this.Entities = [];
    }

    WithEntity: (func: (builder: IEntityBuilder) => void) => IWorldBuilder = func => {
        const newEntity = v4();
        const builder = new EntityBuilder(newEntity);
        func(builder);

        return this;
    };

    WithSystem: (system: ISystem) => IWorldBuilder = (system) => {
        this.Systems.push(system);
        return this;
    }

    Build: () => IWorld = () => {
        return {
            Components: this.Components,
            Systems: this.Systems,
            Entities: this.Entities,
        };
    };
}

export interface IWorldBuilder {
    Build: () => IWorld;
    WithSystem: (system: ISystem) => IWorldBuilder;
    WithEntity: (builderFunc: (builder: IEntityBuilder) => void) => IWorldBuilder;
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
    ExecuteStep: (world: IWorld) => Promise<IStepResult> = async world => {
        const results = await Promise.all(world.Systems.map(system => {
            system.execute(world);
        }));
        R.flatten(results);
        return { SystemResults: []}
    };
}