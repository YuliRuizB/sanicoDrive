import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownPage } from './down-page';

describe('DownPage', () => {
  let component: DownPage;
  let fixture: ComponentFixture<DownPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
