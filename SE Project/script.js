//const { url } = require("inspector");
// import { greet } from './module.js';
// greet('User');


document.addEventListener("DOMContentLoaded", () => {
    const profileToggle = document.querySelector(".profile-toggle");
    const profileDropdown = document.querySelector(".profile-dropdown");
if (profileToggle)
    profileToggle.addEventListener("click", () => {
        profileDropdown.classList.toggle("open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
        if (profileDropdown && profileDropdown.length && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.remove("open");
        }
    });
});

// Placeholder for interactivity or dynamic features
document.addEventListener("DOMContentLoaded", () => {
  console.log("YourProperty.com is ready for action!");
});

// JavaScript for Scroll Detection
document.addEventListener("scroll", () => {
  const scrolledClass = "scrolled";
  const scrollPosition = window.scrollY;

  if (scrollPosition > 50) {
    document.body.classList.add(scrolledClass);
  } else {
    document.body.classList.remove(scrolledClass);
  }
});

// JavaScript to Handle Search Form Submission
// let propSearchForm=document.getElementById('property-search-form')

window.onload = () => {
  let btn1 = document.getElementById("mysearchbtn");
  if (btn1)
    btn1.onclick = function (event) {
      console.log("asdasd");

      // event.preventDefault(); // Prevent form from submitting normally

      // Get user inputs
      const location = document.getElementById("location").value.trim();
      const propertyType = document
        .getElementById("property-type")
        .value.trim();
      const priceRange = document.getElementById("price-range").value.trim();
      const propertySize = document
        .getElementById("property-size")
        .value.trim();

      // Construct the URL for the property search results
      const searchUrl = `search.html?location=${encodeURIComponent(
        location
      )}&type=${encodeURIComponent(propertyType)}&price=${encodeURIComponent(
        priceRange
      )}&size=${encodeURIComponent(propertySize)}`;

      // Redirect to the search results page
      window.location.href = searchUrl;

      fetch("http://localhost:3000/properties/search", {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: location,
          type: propertyType,
          price: priceRange,
          size: propertySize,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
        });
    };
};

//for all properties,explore now button which leads to search page

//for explore now button
let ctaBtn = document.querySelector('.cta-button')

if (ctaBtn)
  ctaBtn.addEventListener('click', () => {
    window.location.href = 'search.html';
});

if (ctaBtn)
ctaBtn.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('property-results');

    // Fetch properties from the backend
    fetch('http://localhost:3000/properties/all')
      .then(response => response.json())
      .then(properties => {
        if (properties.length === 0) {
          resultsContainer.innerHTML = '<p>No properties available at the moment.</p>';
          return;
        }

        console.log(properties[0].imageURL)
        // Generate HTML for each property
        const propertiesHTML = properties.map(property => `
          <div class="property-card">
            <img src="${property.imageURL || './styles/Images/placeholder.jpg'}" alt="Property Image" class="property-image">
            <div class="property-details">
              <h3>${property.propertyType}</h3>
              <p>City: ${property.city}</p>
              <p>Town: ${property.town}</p>
              <p>Price: ${property.price}</p>
              <p>Size: ${property.size} sqft</p>
              <p>${property.description}</p>
            </div>
          </div>
        `).join('');

        resultsContainer.innerHTML = propertiesHTML;
      })
      .catch(err => {
        console.error('Error fetching properties:', err);
        resultsContainer.innerHTML = '<p>Failed to load properties. Please try again later.</p>';
      });
  });

document.addEventListener("DOMContentLoaded", () => {
  // Logic for "Explore Now" button on index.html
  const ctaBtn = document.querySelector(".cta-button");
  if (ctaBtn) {
    ctaBtn.addEventListener("click", () => {
      window.location.href = "search.html";
    });
  }

  // Logic for fetching and displaying properties on search.html
  const resultsContainer = document.getElementById("property-results");
  if (resultsContainer) {
    // Fetch properties from the backend
    fetch("http://localhost:3000/properties/all")
      .then((response) => response.json())
      .then((properties) => {
        if (properties.length === 0) {
          resultsContainer.innerHTML =
            "<p>No properties available at the moment.</p>";
          return;
        }

        // Generate HTML for each property
        const propertiesHTML = properties
          .map(
            (property) => `
                  <div class="property-card">
                      <img src="${
                        property.imageURL || "./styles/Images/placeholder.jpg"
                      }" alt="Property Image" class="property-image">
                      <div class="property-details">
                          <h3>${property.propertyType}</h3>
                          <p>City: ${property.city}</p>
                          <p>Town: ${property.town}</p>
                          <p>Price: ${property.price}</p>
                          <p>Size: ${property.size} sqft</p>
                          <p>${property.description}</p>
                      </div>
                  </div>
              `
          )
          .join("");

        resultsContainer.innerHTML = propertiesHTML;
      })
      .catch((err) => {
        console.error("Error fetching properties:", err);
        resultsContainer.innerHTML =
          "<p>Failed to load properties. Please try again later.</p>";
      });
  }
});

let a = document.getElementById("signup-form");
if (a) {
  a.addEventListener("submit", (event) => {
    event.preventDefault();

    fetch("http://localhost:3000/users/register", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        window.location.href = "index.html";
      });
  });
}

// let b = document.getElementById("property-form");
let propSubmitBtn = document.getElementById('prop-submit-btn')
if (propSubmitBtn) {
    propSubmitBtn.addEventListener("click", (event) => {
    console.log('Submitting property...');
    
    event.preventDefault();

    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
        alert('Please log in before listing a property.');
        window.location.href = 'profile.html'; // Redirect to login page
        return;
    }

    // Parse user data to get user ID
    const user = JSON.parse(userData);
    if (!user || !user.id) {
        alert('User information is incomplete. Please log in again.');
        window.location.href = 'profile.html';
        return;
    }

    // Validate listing type is selected
    const listingType = document.getElementById("listing-type").value;
    if (!listingType) {
        alert('Please select whether the property is for sale or rent.');
        return;
    }

    // Collect form data
    const propertyData = {
        userId: user.id, // Add the user ID from localStorage
        description: document.getElementById("description").value,
        propertyType: document.getElementById("property-type").value,
        listingType: listingType, // Add the listing type (sale or rent)
        city: document.getElementById("city").value,
        town: document.getElementById("town").value,
        size: document.getElementById("size").value,
        price: document.getElementById("price").value,
        imageurl: document.getElementById("imageurl").value,
    };

    console.log('Sending property data with user ID:', propertyData);

    // Send data to server
    fetch("http://localhost:3000/properties/register", {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(propertyData),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Server response:', data);
        if (data.success) {
            alert('Property added successfully!');
            window.location.href = "index.html";
        } else {
            alert('Error adding property: ' + (data.message || 'Unknown error'));
        }
    }).catch(err => {
        console.error('Error submitting property:', err);
        alert('Failed to add property. Please try again later.');
    });
});
}