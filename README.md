# 📚 Задавальник — Интерактивный задачник

## 🚀 Деплой на GitHub Pages (автоматический)

1. **Включите GitHub Pages** в настройках репозитория:
   - Зайдите в **Settings → Pages**
   - В разделе **Source** выберите **GitHub Actions**
   
2. **Запушьте код** в ветку `main`:
   ```bash
   git add .
   git commit -m "Добавить задавальник"
   git push origin main
   ```

3. GitHub Actions **автоматически соберёт** проект и задеплоит его.
   Ссылка на сайт появится в **Actions** → ваш workflow → вкладка **Deployments**.

---

## 🔧 Ручной деплой (если не хотите Actions)

Если вы загружаете на GitHub Pages вручную, важно загружать **содержимое папки `dist/`**, а не весь проект!

```bash
# Соберите проект
npm run build

# Создайте ветку gh-pages из папки dist
cd dist
git init
git add .
git commit -m "Deploy"
git remote add origin https://github.com/USERNAME/REPO.git
git push origin HEAD:gh-pages --force
```

⚠️ **Частая ошибка:** загрузить корень проекта вместо `dist/` → страница белая, потому что браузер не находит JS/CSS файлы.
