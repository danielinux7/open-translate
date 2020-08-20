import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'translate-type',
  templateUrl: './translate-type.component.html',
  styleUrls: ['./translate-type.component.css']
})
export class TranslateTypeComponent implements OnInit {
  selectedType: string;

  ngOnInit(): void {
    this.selectedType = "text"
  }

  onSelectType(type: string): void {
    this.selectedType = type
  }

}
