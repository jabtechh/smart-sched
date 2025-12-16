# Reports Feature - Quick Start Guide

## Accessing Reports

### For Admin/Super-Admin Users
**Navigation:** Sidebar → Reports
- URL: `http://localhost:5173/admin/reports`
- Access Level: Admin and Super-Admin roles only

**What You Can See:**
- All facility reservations and usage data
- All check-in activity across all professors
- Room utilization statistics and trends
- Filter by date range and specific rooms
- Export facility reports to PDF

### For Professors
**Navigation:** Sidebar → Reports  
- URL: `http://localhost:5173/prof/reports`
- Access Level: Professor role (and above)

**What You Can See:**
- Your personal reservations
- Your personal check-in history
- Filter by date range
- Export your personal reports to PDF

---

## Feature Walkthrough

### 1. Selecting Your Report
Admin Dashboard has three tabs:
- 📅 **Reservation Dashboard** - Booking statistics and recent reservations
- ✓ **Check-in Analytics** - Check-in activity and attendance
- 🏢 **Room Utilization** - Room usage efficiency

### 2. Filtering Data
All reports use the same filter panel:
- **Date Range:** Set custom start/end dates
- **Quick Presets:** Today / Last 7 Days / Last 30 Days
- **Room Selection:** Multi-select specific rooms (or all)

### 3. Understanding the Data

#### Reservation Dashboard
- **Total Bookings:** Count of all room reservations in date range
- **Active Rooms:** Number of rooms currently in use
- **Upcoming:** Reservations that haven't started yet
- **Completed:** Finished reservations

#### Check-in Analytics
- **Total Check-ins:** Count of check-in events
- **Unique Users:** How many different people checked in
- **Avg Duration:** Average time spent in rooms
- **Most Used Room:** Most popular room

#### Room Utilization  
- **Utilization %:** How much a room is being used
  - 70%+ = Green (High utilization)
  - 40-70% = Yellow (Medium)
  - <40% = Red (Low)
- **Bookings:** Number of times room was reserved
- **Hours Used:** Total hours room was occupied

### 4. Exporting Reports
**Button:** "📥 Export PDF" (top right of page)
- Creates an HTML file that can be printed to PDF
- Includes report period and filters applied
- Professional formatting for presentations
- Downloads as `Report_Name_YYYY-MM-DD.html`

---

## Test Data Available

You can test the reports with existing test data:
- Users: superadmin@gmail.com, adminone@pateros.edu.ph
- Password: password123
- Test rooms already in system
- Test reservations and check-ins available

---

## Tips for Best Results

1. **Start with Last 30 Days** to see good data volume
2. **Use Room Filter** to analyze specific facilities
3. **Check Utilization % Chart** - shows at a glance which rooms are busy
4. **Export Before Meetings** - have PDF ready for presentation
5. **Monitor Peak Hours** - filtering by date helps identify busy times

---

## Known Limitations & Future Improvements

Current:
✅ Basic filtering (date range, rooms)
✅ Summary statistics and tables
✅ HTML export functionality
✅ Real-time data from Firestore

Planned:
- Chart visualizations (line graphs, bar charts)
- Excel/CSV export options
- Automated email reports
- More granular filters (by professor, course)
- Capacity planning tools
- Conflict detection warnings

---

## Troubleshooting

**"No data found"**
- Try extending the date range
- Check if rooms are selected (unselect to see all)

**PDF export not working**
- Check browser console for errors
- Ensure pop-ups aren't blocked
- Try different browser if persistent

**Reports loading slowly**
- Large date ranges will load more data
- Try narrowing the period
- Check internet connection

---

## Database Collections Used

Reports pull from:
- `roomSchedules` - All professor room bookings
- `checkIns` - All check-in/check-out events
- `rooms` - Room information (name, building, floor)
- `users` - User information (email, name)

Queries are optimized with:
- Date range filtering at database level
- Efficient aggregation in app
- Limited result sets for performance
