import { Component, ISystem, SystemResult, VoidSystem, WorldBuilder, WorldRunner } from "./ecs";

class TransactionIngested extends Component {
    type: string = "TransactionIngested";
    date: Date;

    constructor(date: Date) {
        super();
        this.date = date;
    }
}

class Price extends Component { 
    type: string = "Price";
    price: number = 0;
}

class Quantity extends Component {
    type: string = "Quantity";
    quantity: number = 0;
}


const helloSystem = new VoidSystem('hello world', async () => console.log('hello world'));

const ingestorSystem = new VoidSystem('ingestor', async (world) => {
    world.addEntity(builder => {
        builder.WithComponent(new TransactionIngested(new Date())).WithComponent(new Price())
    })


});


const main = async () => {
    const world = new WorldBuilder().WithSystem(helloSystem).Build();
    const runner = new WorldRunner();
    runner.ExecuteStep(world);
}

main().then(() => {
    console.log('done');
    process.exit();
}).catch(() => {
    console.log('error');
    process.exit(1);
});
