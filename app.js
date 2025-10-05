const restaurants = [
  {
    name: "The Spice Club",
    cuisine: "Indian, North Indian",
    image: "https://source.unsplash.com/400x300/?indian-food"
  },
  {
    name: "Pasta Palace",
    cuisine: "Italian",
    image: "https://source.unsplash.com/400x300/?pasta"
  },
  {
    name: "Sushi Express",
    cuisine: "Japanese, Sushi",
    image: "https://source.unsplash.com/400x300/?sushi"
  },
  {
    name: "Burger Bros",
    cuisine: "Burgers, Fast Food",
    image: "https://source.unsplash.com/400x300/?burger"
  }
];

function loadRestaurants(list = restaurants) {
  const container = document.getElementById("restaurantList");
  container.innerHTML = "";

  if (list.length === 0) {
    container.innerHTML = "<p>No restaurants found. Try a different search.</p>";
    return;
  }

  list.forEach(restaurant => {
    const card = document.createElement("div");
    card.className = "restaurant-card";

    card.innerHTML = `
      <img src="${restaurant.image}" alt="${restaurant.name}" />
      <h3>${restaurant.name}</h3>
      <p>${restaurant.cuisine}</p>
    `;

    container.appendChild(card);
  });
}

function search() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filtered = restaurants.filter(r =>
    r.name.toLowerCase().includes(input) ||
    r.cuisine.toLowerCase().includes(input)
  );
  loadRestaurants(filtered);
}

// Load initial list
window.onload = () => loadRestaurants();
