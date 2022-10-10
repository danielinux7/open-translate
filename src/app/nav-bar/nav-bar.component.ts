import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'nav-bar',
  templateUrl: './nav-bar.component.html',
  styleUrls: ['./nav-bar.component.css']
})
export class NavBarComponent implements OnInit {
  darkMode: string;
  constructor() { }

  ngOnInit(): void {
    if (!localStorage.getItem("darkMode"))
      localStorage.setItem("darkMode", "light");
    this.darkMode = localStorage.getItem("darkMode");
  }

  toggleDarkMode() {
    let body = document.getElementsByTagName("body");
    if (this.darkMode == "light") {
      localStorage.setItem("darkMode", "dark");
      this.darkMode = "dark";
      console.log(body)
    

    }
    else {
      localStorage.setItem("darkMode", "light");
      this.darkMode = "light";

    }

  }

}
