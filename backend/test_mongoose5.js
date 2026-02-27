import mongoose from 'mongoose';

const testSchemas = [
    { name: 'S1', schema: { c: [{ type: String }] } },
    { name: 'S2', schema: { c: [String] } },
    { name: 'S3', schema: { c: { type: Array } } },
    { name: 'S4', schema: { c: { type: [String] } } }
];

async function test() {
    for (const ts of testSchemas) {
        const S = new mongoose.Schema(ts.schema);
        const M = mongoose.model(ts.name, S);
        try {
            await new M({ c: ['[ { cloverId: "", name: "Battery" } ]'] }).validate();
        } catch (e) {
            console.log(ts.name, 'with [string] =>', e.message);
        }

        try {
            await new M({ c: [{ cloverId: "", name: "Battery" }] }).validate();
        } catch (e) {
            console.log(ts.name, 'with object =>', e.message);
        }
    }
}

test().then(() => process.exit(0));
