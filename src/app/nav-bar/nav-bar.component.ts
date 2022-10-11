import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
    if (!localStorage.getItem("darkMode"))
      localStorage.setItem("darkMode", "");
    document.body.classList.add(localStorage.getItem("darkMode"));
  }

  toggleDarkMode() {
    let isAdded = document.body.classList.toggle("dark");
    if (isAdded) {
      localStorage.setItem("darkMode", "dark");
    }
    else {
      localStorage.setItem("darkMode", "");
    }
  }

}
