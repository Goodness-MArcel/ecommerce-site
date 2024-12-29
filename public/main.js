
class ProductSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.resultsContainer = document.getElementById('displaySearchedProducts');
        this.debounceTimeout = null;
        this.initializeSearch();
    }

    initializeSearch() {
        this.searchInput.addEventListener('input', () => {
            clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => this.handleSearch(), 300);
        });

        // Add blur event listener to hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.searchInput.contains(e.target) && !this.resultsContainer.contains(e.target)) {
                this.clearResults();
            }
        });
    }

    async handleSearch() {
        const searchTerm = this.searchInput.value.trim();

        if (!searchTerm) {
            this.clearResults();
            return;
        }

        try {
            const data = await this.fetchSearchResults(searchTerm);
            this.displayResults(data.products);
        } catch (error) {
            console.error('Error fetching search results:', error);
            this.showError('Failed to fetch search results');
        }
    }

    async fetchSearchResults(searchTerm) {
        const response = await fetch(`/search-products?query=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    }

    displayResults(products) {
        this.clearResults();
        
        if (!products || products.length === 0) {
            this.showNoResults();
            return;
        }

        const resultsWrapper = document.createElement('div');
        resultsWrapper.className = 'search-results-wrapper p-3 bg-white shadow-lg rounded-lg';

        products.forEach(product => {
            const productElement = this.createProductElement(product);
            resultsWrapper.appendChild(productElement);
        });

        this.resultsContainer.appendChild(resultsWrapper);
    }

    createProductElement(product) {
        const productDiv = document.createElement('div');
        productDiv.className = 'product-result  hover:bg-gray-100 rounded transition-all';

        const productLink = document.createElement('a');
        productLink.href = `/product/${product.product_id}`;
        productLink.className = 'flex items-center text-decoration-none';

        // Add product image if available
        if (product.image) {
            const img = document.createElement('img');
            img.src = product.image;
            img.className = 'w-12 h-12 object-cover rounded mr-3';
            img.alt = product.name;
            productLink.appendChild(img);
        }

        const productInfo = document.createElement('div');
        productInfo.className = 'flex-grow';

        const productName = document.createElement('div');
        productName.className = 'text-lg font-semibold text-gray-800';
        productName.textContent = product.name;

        // Add price if available
        if (product.price) {
            const productPrice = document.createElement('div');
            productPrice.className = 'text-sm text-gray-600';
            productPrice.textContent = `$${product.price.toFixed(2)}`;
            productInfo.appendChild(productPrice);
        }

        productInfo.appendChild(productName);
        productLink.appendChild(productInfo);
        productDiv.appendChild(productLink);

        return productDiv;
    }

    showNoResults() {
        const noResults = document.createElement('div');
        noResults.className = 'p-4 text-center text-gray-500';
        noResults.textContent = 'No products found';
        this.resultsContainer.appendChild(noResults);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'p-4 text-center text-red-500';
        errorDiv.textContent = message;
        this.resultsContainer.appendChild(errorDiv);
    }

    clearResults() {
        this.resultsContainer.innerHTML = '';
    }
}

// Initialize the search functionality
new ProductSearch();


function reduceVideoSpeed() {
    const video = document.getElementById('myVideo');
    console.log(video); // For debugging, to check if the video element is correctly selected
    video.playbackRate = .2; // Reduce the speed to 20%
}

// Ensure the function is called after the video element is loaded
window.onload = function() {
    reduceVideoSpeed();
};

// navigati2on bar toggler

function toggler () {
    document.querySelector('.menu-toggler').addEventListener(
        "click" , 
        function () {
            let ul = document.querySelector('.second-ul');
            ul.classList.toggle('show');
        }
    )
}
document.addEventListener("DOMContentLoaded",toggler);
if(window.innerWidth > 992){
// display dynamic contents or the nav bar

    document.addEventListener('DOMContentLoaded', function() {
        let elems = document.querySelectorAll('.nav-item-big');
        let dynamicContent = document.getElementById('dynamic_navCon');
        let activeItem = null;

        const contentMap = {
            content1: `
                <div class="row">
                    <div class="col-md-3">
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> water & beverage</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> fruit & vegetable</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> staple</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> branded food</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                        <li><a href="#"><i class="fa-solid fa-angle-right"></i> breakfast & cereals</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> spices</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> canned food</a></li>
                        <li><a href="#"><i class="fa-solid fa-angle-right"></i> frozen food</a></li>
                        <li><a href="#"><i class="fa-solid fa-angle-right"></i> biscuit & cookies</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                        <li><a href="#"><i class="fa-solid fa-angle-right"></i> picles & condinments</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> instant food</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> dry fruit</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> tea & coffee</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <img src="/src/kitchen.png" alt="" class="img-fluid" style="width: 100%;">
                    </div>
                </div>`,
            content2: `
                <div class="row">
                    <div class="col-md-3" >
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> baby care</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> cosmetics</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> deo & perfumes</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> ayurvedic</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> oral care</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> hair care</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> personal hygiene</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> skin care</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> fashion accessories</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> grooming tools</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> shaving need</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> sanitory need</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <img src="/src/49.jpg" alt="" class="img-fluid" style="width: 100%;">
                    </div>
                </div>`,
            content3: `
                <div class="row">
                    <div class="col-md-3" >
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> cleaning accessories</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> cook wear</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> detergent</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> gardening need</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> kitchen & dining</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> kitchen wear</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> pet wear</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> plastic </a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <ul>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> pooja needs</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> serveware</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> safty accessoris</a></li>
                            <li><a href="#"><i class="fa-solid fa-angle-right"></i> festive decorative</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3">
                        <img src="/src/house.jpg" alt="" class="img-fluid" style="width: 100%;">
                    </div>
                </div>`,

        }
        elems.forEach(element => {
            element.addEventListener('click',function (event) {
                event.preventDefault();
                const target = element.getAttribute('data-target');

                if(activeItem === target){
                    dynamicContent.style.display = dynamicContent.style.display === 'block' ? 'none' : 'block';
                }else{
                    // dynamicContent.style.display = 'block';
                    dynamicContent.style.fontSize = '12px';
                    dynamicContent.className = 'dynamic-content';
                    dynamicContent.innerHTML = contentMap[target];
                    activeItem = target;
                    console.log(activeItem)
                }
            })
        })
        // console.log(dynamicContent);
    });
}
else{
    console.log('error');
}

(function () {
'use strict'
var form = document.getElementById('registerForm')
form.addEventListener('submit', function (event) {
if (!form.checkValidity()) {
    event.preventDefault()
    event.stopPropagation()
}
form.classList.add('was-validated')
}, false)
})();

