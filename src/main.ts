import { ISystem, SystemResult, VoidSystem, WorldBuilder, WorldRunner } from "./ecs";

const helloSystem = new VoidSystem('hello world', async () => console.log('hello world'));


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
