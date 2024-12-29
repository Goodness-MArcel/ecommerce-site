import { jest } from '@jest/globals';
import { JSDOM } from 'jsdom';

describe('Product Table Row Creation', () => {
  let document;
  let productTableBody;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><div id="productTableBody"></div>');
    document = dom.window.document;
    productTableBody = document.getElementById('productTableBody');
  });

  test('creates product row with correct data', () => {
    const mockProduct = {
      product_id: 1,
      name: 'Test Product',
      category_name: 'Test Category',
      price: 1000,
      stock: 5
    };

    const data = {
      products: [mockProduct]
    };

    data.products.forEach((product) => {
      const row = document.createElement("tr");
      row.dataset.productId = product.product_id;
      row.innerHTML = `
        <td class="p-2 border">${product.name || ''}</td>
        <td class="p-2 border">${product.category_name || ''}</td>
        <td class="p-2 border">₦${(product.price || 0).toLocaleString()}</td>
        <td class="p-2 border">
          <span class="stock-count">${product.stock || 0}</span>
          <button class="update-btn px-2 py-1 bg-green-500 text-white rounded ml-2">Update</button>
        </td>
        <td class="p-2 border">
          <button class="edit-btn px-2 py-1 bg-blue-500 text-white rounded" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
          <button class="delete-btn px-2 py-1 bg-red-500 text-white rounded ml-2">Delete</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    expect(productTableBody.children.length).toBe(1);
    const row = productTableBody.children[0];
    expect(row.dataset.productId).toBe('1');
    expect(row.querySelector('td:nth-child(1)').textContent).toBe('Test Product');
    expect(row.querySelector('td:nth-child(2)').textContent).toBe('Test Category');
    expect(row.querySelector('td:nth-child(3)').textContent).toBe('₦1,000');
    expect(row.querySelector('.stock-count').textContent).toBe('5');
  });

  test('handles null values gracefully', () => {
    const mockProduct = {
      product_id: 2,
      name: null,
      category_name: null,
      price: null,
      stock: null
    };

    const data = {
      products: [mockProduct]
    };

    data.products.forEach((product) => {
      const row = document.createElement("tr");
      row.dataset.productId = product.product_id;
      row.innerHTML = `
        <td class="p-2 border">${product.name || ''}</td>
        <td class="p-2 border">${product.category_name || ''}</td>
        <td class="p-2 border">₦${(product.price || 0).toLocaleString()}</td>
        <td class="p-2 border">
          <span class="stock-count">${product.stock || 0}</span>
          <button class="update-btn px-2 py-1 bg-green-500 text-white rounded ml-2">Update</button>
        </td>
        <td class="p-2 border">
          <button class="edit-btn px-2 py-1 bg-blue-500 text-white rounded" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
          <button class="delete-btn px-2 py-1 bg-red-500 text-white rounded ml-2">Delete</button>
        </td>
      `;
      productTableBody.appendChild(row);
    });

    const row = productTableBody.children[0];
    expect(row.querySelector('td:nth-child(1)').textContent).toBe('');
    expect(row.querySelector('td:nth-child(2)').textContent).toBe('');
    expect(row.querySelector('td:nth-child(3)').textContent).toBe('₦0');
    expect(row.querySelector('.stock-count').textContent).toBe('0');
  });

  test('buttons have correct event listeners', () => {
    const mockProduct = {
      product_id: 3,
      name: 'Test Product',
      category_name: 'Test Category',
      price: 1000,
      stock: 5
    };

    const openEditModal = jest.fn();
    const deleteProduct = jest.fn();
    const updateStock = jest.fn();

    const data = {
      products: [mockProduct]
    };

    data.products.forEach((product) => {
      const row = document.createElement("tr");
      row.dataset.productId = product.product_id;
      row.innerHTML = `
        <td class="p-2 border">${product.name || ''}</td>
        <td class="p-2 border">${product.category_name || ''}</td>
        <td class="p-2 border">₦${(product.price || 0).toLocaleString()}</td>
        <td class="p-2 border">
          <span class="stock-count">${product.stock || 0}</span>
          <button class="update-btn px-2 py-1 bg-green-500 text-white rounded ml-2">Update</button>
        </td>
        <td class="p-2 border">
          <button class="edit-btn px-2 py-1 bg-blue-500 text-white rounded" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
          <button class="delete-btn px-2 py-1 bg-red-500 text-white rounded ml-2">Delete</button>
        </td>
      `;
      productTableBody.appendChild(row);

      const editBtn = row.querySelector(".edit-btn");
      const deleteBtn = row.querySelector(".delete-btn");
      const updateBtn = row.querySelector(".update-btn");

      if (editBtn) editBtn.addEventListener("click", () => openEditModal(product));
      if (deleteBtn) deleteBtn.addEventListener("click", () => deleteProduct(product.product_id));
      if (updateBtn) updateBtn.addEventListener("click", () => updateStock(product.product_id));
    });

    const editBtn = productTableBody.querySelector('.edit-btn');
    const deleteBtn = productTableBody.querySelector('.delete-btn');
    const updateBtn = productTableBody.querySelector('.update-btn');

    editBtn.click();
    deleteBtn.click();
    updateBtn.click();

    expect(openEditModal).toHaveBeenCalledWith(mockProduct);
    expect(deleteProduct).toHaveBeenCalledWith(3);
    expect(updateStock).toHaveBeenCalledWith(3);
  });
});
