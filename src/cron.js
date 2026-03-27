import cron from 'node-cron';
import User from './models/user.js';
import Milk from './models/milk.js';
import ND from 'nepali-date-converter';

const NepaliDate = ND.default || ND;

const createDailyMilkRecords = async () => {
    try {
        const activeUsers = await User.find({ status: true, role: 'user' });
        const today = new NepaliDate(new Date()).format('YYYY/MM/DD');

        for (const user of activeUsers) {
            // Check if a record for the morning session already exists
            const morningMilkExists = await Milk.findOne({
                userid: user._id,
                date: today,
                session: 'morning'
            });

            if (!morningMilkExists) {
                const newMorningMilk = new Milk({
                    userid: user._id,
                    name: user.name,
                    todaymilk: 0,
                    todayfit: 0,
                    todaymoney: 0,
                    monthid: new NepaliDate(new Date()).getMonth(),
                    session: 'morning',
                    date: today
                });
                await newMorningMilk.save();
            }

            // Check if a record for the night session already exists
            const nightMilkExists = await Milk.findOne({
                userid: user._id,
                date: today,
                session: 'night'
            });

            if (!nightMilkExists) {
                const newNightMilk = new Milk({
                    userid: user._id,
                    name: user.name,
                    todaymilk: 0,
                    todayfit: 0,
                    todaymoney: 0,
                    monthid: new NepaliDate(new Date()).getMonth(),
                    session: 'night',
                    date: today
                });
                await newNightMilk.save();
            }
        }
        console.log('Daily milk records created successfully.');
    } catch (error) {
        console.error('Error creating daily milk records:', error);
    }
};

const startCronJobs = () => {
    // Schedule the job to run every day at 12:00 AM
  cron.schedule('48 22 * * *', () => {
    console.log('Running cron job to create daily milk records...');
    createDailyMilkRecords();
});
};

export default startCronJobs;
