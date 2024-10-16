Here’s the **updated README** to reflect the **.env** changes and other adjustments:

---

# Photogram

Photogram is a photo gallery web application built with **React**, **Redux**, **Firebase**, and **TypeScript**. It allows users to upload, display, archive, and manage personal photo galleries with ease.

---

## Table of Contents

1. [Features](#features)  
2. [Technologies Used](#technologies-used)  
3. [Prerequisites](#prerequisites)  
4. [Installation](#installation)  
5. [Environment Configuration](#environment-configuration)  
6. [Available Scripts](#available-scripts)  
7. [API Documentation](#api-documentation)  
8. [Usage](#usage)
10. [License](#license)  

---

## Features

- User authentication with **Firebase**.  
- Upload images with progress tracking and store metadata in **Firestore**.  
- View, archive, and delete personal images.  
- Full CRUD support for managing the image gallery.  
- Responsive UI with simple **routing** for navigation.

---

## Technologies Used

- **React** – Frontend framework.  
- **Redux** – State management.  
- **Firebase** – Authentication and Firestore database.  
- **TypeScript** – Strong typing for safer code.  
- **React Router** – Routing for navigation.  
- **Nginx** & **PM2** – Backend service management and proxy configuration.  

---

## Prerequisites

- **Yarn** – Latest version installed.  
- **Firebase Account** – Firestore enabled.  
- **Node.js** – Version 16.x or higher.   

---

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/andresz74/react-photogram.git
   cd react-photogram
   ```

2. **Install Dependencies:**

   ```bash
   yarn install
   ```

3. **Create the Firebase Project:**

   - Enable **Firestore** in Firebase.
   - Download your **service account key** and place it in the `backend` folder as `photograma-c2078-firebase-adminsdk.json`.

---

## Environment Configuration

Create a **`.env`** file in the root directory to store your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=photograma-c2078.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=photograma-c2078
REACT_APP_FIREBASE_APP_ID=1:169824492279:web:186aa32b5777f06edd51f2
```

This ensures your Firebase credentials are kept **secure** and not hard-coded into your project.

---

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in **development mode**.  
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits, and any lint errors will appear in the console.

### `yarn build`

Builds the app for **production** in the `build` folder.  
The build is minified, and the filenames include hashes.  
Your app is ready for deployment!

### `yarn test`

Launches the test runner in watch mode.

### `yarn eject`

**Note:** Once you `eject`, this action is irreversible. It copies all configuration files and dependencies so you can customize them.

---

## Running the Application

### 1. **Frontend Development Server:**

```bash
yarn start
```

The frontend will be available at [http://localhost:3000](http://localhost:3000).

### 2. **Backend with PM2:**

Navigate to the `backend` folder and start the backend service with:

```bash
pm2 start index.js --name photogram-backend --env production -- PORT=3003
```

---

## API Documentation

### **Upload Image**

**Endpoint:**  
`POST /image-api/upload`

**Request Body:**  
- `image`: Image file (multipart/form-data)

**Response:**

```json
{
  "url": "https://storage.googleapis.com/your-bucket/image-name.jpg"
}
```

---

### **Delete Image**

**Endpoint:**  
`POST /image-api/delete-image`

**Request Body:**

```json
{
  "imgName": "image-name.jpg"
}
```

**Response:**  
- 200: Image deleted successfully.  
- 500: Error deleting the image.

---

## Usage

1. **Login:**  
   Visit `/login` to authenticate with Firebase.

2. **Upload an Image:**  
   Go to `/upload` to select and upload an image. Progress will be displayed during upload.

3. **View and Manage Galleries:**  
   - Visit `/` to see public images.  
   - Go to `/mygallery` for your personal gallery.  
   - Use the **Show/Hide Archived** toggle to manage archived images.

4. **Delete an Image:**  
   Open an image in the modal and delete it from the gallery.

---

## License

This project is licensed under the MIT License.
