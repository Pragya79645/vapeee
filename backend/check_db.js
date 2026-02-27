
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const productSchema = new mongoose.Schema({
    name: String,
    cloverSynced: { type: Boolean, default: false },
    externalCloverId: String,
    productId: String,
    cloverItemGroupId: String
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const targetNames = ["Vapresso Pods", "Tray Cover", "Level X G2Pro Battery", "Allo 25K"];
        let products = await Product.find({ name: { $in: targetNames } });
        console.log(JSON.stringify(products, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
