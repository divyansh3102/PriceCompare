import React, { useEffect, useState } from "react";

const ProductApproval = () => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const res = await fetch("http://localhost:5000/api/products/all");
    const data = await res.json();
    setProducts(data.products || []);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const approve = async (id) => {
    await fetch(`http://localhost:5000/api/products/approve/${id}`, {
      method: "PUT"
    });
    fetchProducts();
  };

  const reject = async (id) => {
    await fetch(`http://localhost:5000/api/products/reject/${id}`, {
      method: "PUT"
    });
    fetchProducts();
  };

  return (
    <div className="p-6 text-white">

      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Product Approval</h1>

        <button
          onClick={() => window.location.href = "/admin"}
          className="bg-gray-600 px-4 py-2 rounded"
        >
          ← Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.filter(p => p.status === "pending").map(product => (
          <div key={product.id} className="bg-[#151b2b] p-4 rounded-xl">

            <img src={product.image} className="h-40 w-full object-cover rounded" />

            <h3 className="mt-2">{product.name}</h3>
            <p>₹{product.price}</p>

            <div className="flex gap-2 mt-3">
              <button onClick={() => approve(product.id)} className="bg-green-500 px-3 py-1 rounded">
                Approve
              </button>

              <button onClick={() => reject(product.id)} className="bg-red-500 px-3 py-1 rounded">
                Reject
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};

export default ProductApproval;