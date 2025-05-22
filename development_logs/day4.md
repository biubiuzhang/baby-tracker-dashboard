## Day 4 – UI Migration to Bootstrap & ESP32 Status Integration

### Summary

Today's work focused on removing TailwindCSS, fully migrating to Bootstrap 5, and implementing a real-time ESP32 status monitor in both the backend and frontend. Significant UI polish was applied to all components to ensure a responsive, readable, and consistent user experience.

## 1. **Removed TailwindCSS Setup (Clean Break)**

### Uninstalled Tailwind and related packages:

```bash
npm uninstall tailwindcss tailwindcss-cli @tailwindcss/postcss postcss autoprefixer
```

### Deleted Tailwind-related config and style files:

```bash
rm -f tailwind.config.* postcss.config.* src/index.css
rm -rf node_modules .vite dist package-lock.json
```

### Removed Tailwind usage in code:

* Deleted `import './index.css'` from `main.jsx`
* Removed all utility classes (e.g., `bg-green-500`, `text-white`, `p-4`)
* Confirmed that no `@tailwind` directives remained

## 2. **Installed and Integrated Bootstrap 5**

### Installed Bootstrap:

```bash
npm install bootstrap
```

### Imported Bootstrap CSS globally in `main.jsx`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

### Refactored All Components to Use Bootstrap:

#### `DashboardPage.jsx`

* Replaced layout with `container`, `py-5`
* Wrapped table in `table-responsive`
* Used `alert` components for system messages
* Added central spacing with `mb-4`, `text-center`

#### `LogEntryForm.jsx`

* Buttons updated to `btn btn-outline-primary fw-semibold`
* Used Bootstrap’s utility classes to ensure spacing and responsiveness

#### `LogTable.jsx`

* Converted to use `table table-bordered table-hover align-middle text-center`
* Added `thead class="table-light"` for consistent header appearance
* Wrapped in `table-responsive` for mobile scroll

#### `Navbar.jsx`

* Used `navbar navbar-expand-lg navbar-dark bg-primary`
* Displayed ESP32 status with a right-aligned Bootstrap `badge`
* Added automatic status refresh every 5 seconds via `setInterval`

## 3. **ESP32 Online Status Integration**

### Backend (`api.py`)

* Added `/api/esp-status` endpoint:

```python
@api.route('/api/esp-status', methods=['GET'])
def esp_status():
    try:
        resp = requests.get(f"{ESP32_URL}/", timeout=2)
        if resp.status_code == 200:
            return jsonify({"online": True})
    except Exception as e:
        print(f"ESP check failed: {e}")
    return jsonify({"online": False})
```

* Set `ESP32_URL = "http://192.168.50.144"` for network communication

* Confirmed successful response with `curl`:

```bash
curl http://192.168.50.144/
```

---

### Frontend

#### `api.js`

* Added unified `checkESPStatus()` using `axios`:

```js
export const checkESPStatus = () =>
  axios.get(`${BACKEND}/api/esp-status`).then(res => res.data.online);
```

#### `Navbar.jsx`

* Added polling logic with `useEffect` and `setInterval`
* Displays:

  * 🟢 `ESP32: Online` with `badge bg-success`
  * ⚪ `ESP32: Offline` with `badge bg-secondary`

## ✅ Final Status

* ✅ Tailwind fully removed and cleaned
* ✅ Bootstrap styling fully applied and stable
* ✅ ESP32 status is visible and reactive in real time
* ✅ All core features remain functional and clean
* ✅ Codebase simplified, modernized, and easier to maintain
---
* ![home page](./images/home_oage_day_4.png)
