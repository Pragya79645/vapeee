import React from "react";

const RefundPolicy = () => {
  return (
    <main className="py-16 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-light text-center text-gray-900 mb-10">Refund / Return Policy</h1>

        <div className="space-y-8">
          <div>
            <div className="inline-block bg-black text-white rounded-md px-4 py-2 mb-4">
              SECTION - RETURN & WARRANTY
            </div>
            <div className="text-gray-700 text-sm leading-relaxed">
              <p className="mb-4">
                Our warranty and return policy is evaluated on a case-by-case basis. Unopened and unused products may be returned within 30 days for store credit, with customers responsible for return shipping fees.
              </p>
              <p className="mb-4">
                Returns for non-damaged goods are subject to a 20% restocking fee. Refunds for e-juices are generally not available unless the issue is due to an error on our part. All clearance items are final sale and cannot be returned or refunded.
              </p>
              <p className="mb-4">
                The warranty excludes damage caused by misuse, normal wear and tear, or cosmetic defects. Coverage may apply to defective products, including issues with LED displays or charging ports.
              </p>
              <p className="mb-4">
                A restocking fee may apply to all returns, and any approved refunds are issued as store credit. If an item is out of stock, a direct refund will be issued to the customer’s card.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default RefundPolicy;
