import mongoose from 'mongoose';

const testSchemas = [
    { name: 'S9', schema: { categories: [{ type: [String] }] } },
    { name: 'S10', schema: { categories: [[String]] } },
    { name: 'S11', schema: { categories: [{ type: String }] } },
    { name: 'S12', schema: { categories: [String] } },
];

async function test() {
    for (const test of testSchemas) {
        const S = new mongoose.Schema(test.schema);
        const M = mongoose.model(test.name, S);
        try {
            await new M({ categories: [{ cloverId: "", name: "Battery" }] }).validate();
            console.log(test.name, '=> Success');
        } catch (e) {
            console.log(test.name, '=> Error:', e.message);
        }
    }
}

test().then(() => process.exit(0));
