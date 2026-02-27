import mongoose from 'mongoose';

const testSchemas = [
    { name: 'S1', schema: { categories: [String] } },
    { name: 'S2', schema: { categories: [{ cloverId: String, name: String }] } },
    { name: 'S3', schema: { categories: [{ type: String }] } },
    { name: 'S4', schema: { categories: mongoose.Schema.Types.Array } },
    { name: 'S5', schema: { categories: { type: Array, items: String } } },
    { name: 'S6', schema: { categories: [[String]] } },
];

async function test() {
    for (const test of testSchemas) {
        const S = new mongoose.Schema(test.schema);
        const M = mongoose.model(test.name, S);
        try {
            // Note: passing the specific payload
            await new M({ categories: ['[ { cloverId: "", name: "Battery" } ]'] }).validate();
            console.log(test.name, '=> Success');
        } catch (e) {
            console.log(test.name, '=> Error:', e.message);
        }
    }
}

test().then(() => process.exit(0));
