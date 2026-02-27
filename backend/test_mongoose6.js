import mongoose from 'mongoose';

const S = new mongoose.Schema({
    categories: [{
        cloverId: { type: String, default: '' },
        name: { type: String, required: true }
    }]
});

const M = mongoose.model('TestSchemaReal', S);

async function run() {
    try {
        await new M({ categories: ['[ { cloverId: "", name: "Battery" } ]'] }).validate();
        console.log('Success - validates embedded doc?');
    } catch (e) {
        console.log('Error:', e.message);
    }
}
run().then(() => process.exit(0));
