const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/newEmployee');
const Attendance = require('./models/attendance');
const flash = require('connect-flash');
const session = require('express-session');
const MongoDBStore = require('connect-mongo');
const dbUrl = 'mongodb://localhost:27017/hr-one1';
const { isLoggedIn, isAdmin } = require('./middlewares/middleware');
const methodOveride = require('method-override');
const attendance = require('./models/attendance');
const moment = require('moment');
moment.locale("en-au");
const Correction = require('./models/attendanceCorrection');

mongoose.connect(dbUrl, {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
	console.log("Database connected");
});

app.use(express.urlencoded({ extended: true }));
app.use(methodOveride('_method'));


app.use(session({
	secret: 'foo',
	store: MongoDBStore.create({ mongoUrl: dbUrl }),
	resave: false,
	saveUninitialized: false,
	cookie: {
		httpOnly: true,
		// secure: true,
		expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
		maxAge: 1000 * 60 * 60 * 24 * 7
	}
}));

app.use(flash());
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.success = req.flash('success');
	res.locals.error = req.flash('error');
	next();
})

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'assets')))
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get('/newuser', isLoggedIn, isAdmin , async(req, res) => {
	const employees = await User.findById(req.session.user_id);
	const allemp = await User.find({});
	console.log("allemp:", allemp);
	res.render('newuser', {employees, allemp})
})


app.post('/newuser', isLoggedIn, isAdmin, async (req, res) => {
	console.log('hi');
	console.log(req.body);
	const { employeeCode,
		username,
		dateOfJoining,
		dateOfBirth,
		gender,
		managerCode,
		emailAddress,
		mobileNo,
		profile,
		role, password } = req.body;
	const employee = new User({
		employeeCode,
		username,
		dateOfJoining,
		dateOfBirth,
		gender,
		managerCode,
		emailAddress,
		mobileNo,
		profile,
		role
	});

	const allemp = await User.find({});
	const adduser = await User.register(employee, password);
	const employees = await User.findById(req.session.user_id);
	await adduser.save();
	console.log(adduser)
	//res.render('user', {employees, allemp})
	res.redirect('/user')

})

app.post('/checkin', isLoggedIn, async (req, res) => {

	const finduser = await Attendance.find({userId: req.session.user_id, date: moment().format("L")})
	console.log("finduser: ", finduser);
	if(finduser.length){
		//const employees = await User.findById(req.session.user_id);
		req.flash('error', 'You are already checkedIn');
		res.redirect('/user');
	}
	else{
		const employees = await User.findById(req.session.user_id);
		const attendDate = await Attendance.find({ userId: req.session.user_id })
		const attendance = new Attendance({ date: moment().format("L"), checkin: moment().format("LTS"), checkout: null, status: 'Pending', userId: req.session.user_id, managerCode: employees.managerCode })
		await attendance.save();
		//console.log("attenDate", attendDate);
		//res.render('attendance', { employees, attendDate })
		res.redirect('/attendance')
	}
})


app.put('/checkout', isLoggedIn, async (req, res) => {
	
	const finduser = await Attendance.find({userId: req.session.user_id, date: moment().format("L")})
	console.log("finduser: ", finduser);
	if(finduser.length){
		const attendance = await Attendance.findOneAndUpdate({userId: req.session.user_id, date: moment().format("L")}, {$set:{checkout: moment().format("LTS")}})
		const employees = await User.findById(req.session.user_id);
		const attendDate = await Attendance.find({ userId: req.session.user_id })
		console.log("attenDate", attendDate);
		res.render('attendance', { employees, attendDate })
	}
	else{
		//const employees = await User.findById(req.session.user_id);
		req.flash('error', 'Do Checkin First') 
		res.redirect('/user')

	}
})


app.put('/approve/attendance/:id', isLoggedIn, async (req, res) => {
	const status = req.params.id;
	const statusupdate = await Attendance.findByIdAndUpdate(status, {status: req.body.status});
	req.flash('success', 'Updated') 
	res.redirect('/approve/attendance')
})

app.put('/approve/attendance/correction/:id', async (req, res) => {
	const status = req.params.id;
	console.log("status:", status)
	const statusupdateattendance = await Attendance.findByIdAndUpdate(status, {status: req.body.status});
	const statusupdatecorrection = await Correction.findByIdAndUpdate(status, {status: req.body.status});
	req.flash('success', 'Updated') 
	res.redirect('/correction/attendance')
})

app.get('/employeeDirectory', isLoggedIn, isAdmin, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	const allemployees = await User.find({});
	console.log(allemployees)
	res.render('employeeDirectory', {employees, allemployees})
})

app.get('/employeeDirectory/:id', isLoggedIn, isAdmin, async (req, res) => {
	const details = req.params.id;
	console.log("details:", details);
	const employees = await User.findById(details);
	console.log(employees);
	res.render('editdetails', {employees, details})
})

app.put('/employeeDirectory/:id/update', isLoggedIn, isAdmin, async (req, res) => {
	await User.findByIdAndUpdate(req.params.id, {...req.body});
	req.flash('success', "Details Update Successfully")
	res.redirect('/employeeDirectory')
})

app.get('/attendance/correction', async (req, res) => {
	//const {id} = req.params;
	const employees = await User.findById(req.session.user_id);
	const manager = await User.find({employeeCode: employees.managerCode});
	console.log(manager)
	const correction = await Correction.find({userId: req.session.user_id})
	res.render('showAttendanceCorrection', {correction, employees, manager})
})

app.get('/correction/attendance', isLoggedIn, isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	const correction = await Correction.find({managerCode: employees.employeeCode});
	console.log("approve:", correction);
	const userlist=[]
	for(let i of correction){
		const users = await User.findById(i.userId);	
		userlist.push(users);
	}
	res.render('approveAttendanceCorrection', { employees, correction, userlist })
})

app.post('/attendance/correction/:id', async (req, res) => {
	const employees = await User.findById(req.session.user_id);
		const {id} = req.params;
		//const attendDate = await Attendance.find({ userId: req.session.user_id })
		const {correctiondate, punchin, punchout, remark} = req.body;
		const attendance = new Correction({ date: correctiondate, checkin: punchin, checkout: punchout, remark: remark, status: 'Pending', userId: req.session.user_id, managerCode: employees.managerCode })
		await attendance.save();
		//console.log("attenDate", attendDate);
		//res.render('attendance', { employees, attendDate })
		const correction = await Correction.find({userId: id})
		res.redirect('/attendance/correction')
})


app.get('/login', (req, res) => {
	res.render('login')
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), async (req, res) => {

	console.log("HI from login")
	console.log("Autheication Correct")
	console.log(req.body)
	const { username } = req.body;
	const employees = await User.findByUsername(username);
	const manager = await User.find({employeeCode: employees.managerCode})
	req.session.user_id = employees._id
	res.render('user', { employees, manager })

})

app.delete('/employeeDirectory/:id', isLoggedIn, isAdmin, async (req, res) => {
	const {id} = req.params;
	await User.findByIdAndDelete(id);
	res.redirect('/employeeDirectory')
})

app.post('/logout', (req, res) => {
	req.logout()
	req.flash('error', 'Bye! Thank You')
	res.redirect('/login');
})

app.get('/user', isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	const manager = await User.find({employeeCode: employees.managerCode})
	res.render('user', { employees, manager })
})

// app.get('/newemployee', async (req, res) => {
// 	const empl = new User({ Employee_code: 1, First_Name: 'Praveen' })
// 	await empl.save();
// 	res.send(empl)
// });

app.get('/profile', isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	res.render('profile', { employees })
})

app.get('/search', isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	res.render('search', { employees })
})

app.get('/documents', isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	res.render('documents', { employees })
})

app.post('/search/username', isLoggedIn, async (req, res) => {
	const {Search} = req.body;
	console.log(Search);
	const employees = await User.findById(req.session.user_id);
	const searchuser = await User.find({username: Search});
	console.log(searchuser);
	res.render('searchemployee', { searchuser, employees })
})


app.get('/show', isLoggedIn, async (req, res) => {
	const employees = await User.find({});
	res.render('user', { employees })
})

app.get('/attendance', isLoggedIn, isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	const attendDate = await Attendance.find({ userId: req.session.user_id })
	const correctiondate = await Correction.find({ userId: req.session.user_id })
	console.log(correctiondate);
	res.render('attendance', { employees, attendDate, correctiondate })
})



app.get('/approve/attendance', isLoggedIn, isLoggedIn, async (req, res) => {
	const employees = await User.findById(req.session.user_id);
	const approve = await Attendance.find({managerCode: employees.employeeCode});
	console.log("approve:", approve);
	const userlist=[]
	for(let i of approve){
		const users = await User.findById(i.userId);	
		userlist.push(users);
	}
	res.render('approveAttendance', { employees, approve, userlist })
})

app.use((req, res) => {
	res.status(404).send('NOT FOUND!!')
})

app.listen(3000, () => {
	console.log('Running on port 3000');
})