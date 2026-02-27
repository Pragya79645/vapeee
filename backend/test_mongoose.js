import mongoose from 'mongoose';

const s1 = new mongoose.Schema({
    c: [String]
});
const M1 = mongoose.model('T1', s1);

const s2 = new mongoose.Schema({
    c: [{
        cloverId: String,
        name: String
    }]
});
const M2 = mongoose.model('T2', s2);

async function test() {
    try {
        await new M1({ c: ['[ { cloverId: "", name: "Battery" } ]'] }).validate();
        console.log('M1: Success');
    } catch (e) {
        console.log('M1 Error:', e.message);
    }

    try {
        await new M2({ c: ['[ { cloverId: "", name: "Battery" } ]'] }).validate();
        console.log('M2 string: Success');
    } catch (e) {
        console.log('M2 string Error:', e.message);
    }

    try {
        await new M2({ c: [{ cloverId: '', name: '[ { cloverId: "", name: "Battery" } ]' }] }).validate();
        console.log('M2 nested: Success');
    } catch (e) {
        console.log('M2 nested Error:', e.message);
    }
}
test().then(() => process.exit(0));
