# Phase 1 Testing Guide

## Setup

### 1. Install Dependencies
```bash
git checkout perf/phase-1-ui-optimization
npm install
```

### 2. Build for Analysis
```bash
# Build the production bundle
npm run build

# Check the bundle size
ls -lh build/static/js/*.js

# To get a detailed breakdown, use webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer
WITH_ANALYZER=true npm run build
```

## Testing Checklist

### Visual Testing
- [ ] Start dev server: `npm start`
- [ ] Navigate to http://localhost:3000
- [ ] **Header Layout**: Verify logo, navigation menu, and login button render correctly
- [ ] **Desktop (1920x1080)**: All header items visible and aligned
- [ ] **Tablet (768px)**: Menu should be responsive
- [ ] **Mobile (375px)**: Menu should collapse/expand properly

### Functionality Testing
- [ ] **Login**: Click login button → redirects to auth flow correctly
- [ ] **Logout**: After login, logout button works and clears session
- [ ] **Navigation**: All nav items (Browse, Curate, Harvest, etc.) navigate correctly
- [ ] **Documentation Link**: Opens https://docs.clearlydefined.io in new tab

### Style/CSS Testing
- [ ] No unstyled elements (buttons/menus should look normal)
- [ ] Icons render correctly (LoginOutlined, LogoutOutlined, MenuOutlined, CloseOutlined)
- [ ] No console CSS warnings about missing classes
- [ ] Ant Design theme applies consistently
- [ ] No Bootstrap styles bleeding through

### Performance Testing
- [ ] **Bundle size**: Check that it's smaller than master branch
  ```bash
  # On master
  npm run build && ls -lh build/static/js/*.js
  
  # On perf/phase-1-ui-optimization
  npm run build && ls -lh build/static/js/*.js
  ```
- [ ] **Load time**: Chrome DevTools → Performance tab
  - Record page load
  - Check Largest Contentful Paint (LCP)
  - Should be noticeably faster

### Browser Compatibility
- [ ] Chrome/Chromium: Latest version
- [ ] Firefox: Latest version
- [ ] Safari: Latest version (if available)

## Troubleshooting

### Issue: Button styles look wrong
**Solution**: Check that Ant Design Button component is properly imported
```javascript
import { Button } from 'antd'
```

### Issue: Icons not showing
**Solution**: Verify @ant-design/icons package is installed
```bash
npm install @ant-design/icons
```

### Issue: Menu doesn't expand on mobile
**Solution**: Ensure responsive breakpoint logic is working in Header component

### Issue: Bootstrap styles still present
**Solution**: Clear browser cache and rebuild
```bash
rm -rf build node_modules/.cache
npm run build
```

## Performance Measurement

### Using Lighthouse (Chrome DevTools)
1. Open DevTools (F12)
2. Click on "Lighthouse" tab
3. Click "Analyze page load"
4. Compare metrics with master branch

### Using Chrome Performance Tab
1. Open DevTools → Performance tab
2. Click record, refresh page, stop recording
3. Look for:
   - **DOMContentLoaded**: Should be < 2s
   - **Load**: Should be < 3s
   - **Largest Contentful Paint (LCP)**: Should be < 2.5s

## Expected Results

✅ **Visual**: Header should look identical or better
✅ **Functionality**: All header interactions work as before
✅ **Performance**: 
  - Bundle size: ~30-40% smaller than master
  - Load time: ~50% faster initial load
  - LCP: Improved by 500-1000ms

## Reporting Issues

If you find issues, please document:
1. **What failed**: Clear description
2. **Browser/OS**: Chrome 90 on macOS, etc.
3. **Screenshots**: If visual issue
4. **Console errors**: Copy any error messages
5. **Steps to reproduce**: Exact steps to trigger

## Next Phase

Once testing passes:
1. We can migrate other components (LicensePicker, ComponentButtons, etc.)
2. Or proceed to Phase 2 (React 18 upgrade)
3. Create a PR for peer review

---

**Need help?** Create an issue on GitHub or reach out.
