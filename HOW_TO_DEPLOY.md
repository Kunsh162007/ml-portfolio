# How to Deploy to GitHub Pages

Follow these steps to make your portfolio live:

1. **Create a New Repository on GitHub**:
   - Go to [github.com/new](https://github.com/new).
   - Name it `ml-portfolio` (or any name you prefer).
   - Keep it **Public**.
   - Do **NOT** initialize with a README, license, or gitignore (we already have these).

2. **Link and Push Your Code**:
   - Open your terminal in `c:\Users\Lenovo\ML_MODELS - Projects\portfolio-website\`.
   - Run the following commands (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):
     ```bash
     git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
     git branch -M main
     git push -u origin main
     ```

3. **Enable GitHub Pages**:
   - On your GitHub repository page, go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Branch**, select `main` and `/ (root)`.
   - Click **Save**.

4. **View Your Site**:
   - After a few minutes, your site will be live at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
