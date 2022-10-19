import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    if (localStorage.getItem("darkMode"))
      document.body.classList.add("dark");
  }

  toggleDarkMode() {
    let isAdded = document.body.classList.toggle("dark");
    if (isAdded) {
      localStorage.setItem("darkMode", "dark");
    }
    else {
      localStorage.removeItem("darkMode");
    }
  }

}
