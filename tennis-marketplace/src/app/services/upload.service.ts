import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface UploadResponse {
  success: boolean;
  message: string;
  urls: string[];
  fileNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  private readonly API_BASE = 'http://localhost:5000/api/upload';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  uploadImages(files: File[]): Observable<UploadResponse> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('images', file);
    });

    // Don't set Content-Type for file uploads - let browser set multipart/form-data
    const headers = this.authService.getAuthHeaders().delete('Content-Type');

    return this.http.post<UploadResponse>(
      `${this.API_BASE}/images`,
      formData,
      { headers }
    );
  }

  uploadSingleImage(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    // Don't set Content-Type for file uploads - let browser set multipart/form-data
    const headers = this.authService.getAuthHeaders().delete('Content-Type');

    return this.http.post<UploadResponse>(
      `${this.API_BASE}/image`,
      formData,
      { headers }
    );
  }
}