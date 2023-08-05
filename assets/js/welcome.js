document.getElementById("continue-btn").addEventListener("click", function() {
    // Generate a random number between 0 and 1
    var randomNumber = Math.random();

    // 50% chance to redirect to google and 50% chance to redirect to usc.edu
    if (randomNumber < 0.5) {
      window.location.href = "b-intro.html";
      localStorage.setItem("first_mode", "b");
    } else {
      window.location.href = "p-intro.html";
      localStorage.setItem("first_mode", "p");
    }
    console.log("first_mode:" + localStorage.getItem(first_mode));
});
