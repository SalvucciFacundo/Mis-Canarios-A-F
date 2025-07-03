import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dashboard principal del panel de administración.
 */
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent { }
