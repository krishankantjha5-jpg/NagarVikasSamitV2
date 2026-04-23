const t = {
    en: {
        // Navbar
        home: 'Home',
        ourLeaders: 'Our Leaders',
        joinVolunteer: '🤝 Join as Volunteer',

        // Header
        orgName: 'Nagar Vikas Samiti',

        // Home — Our Work
        ourWork: 'Our Work',
        images: 'Images',
        videos: 'Videos',
        noActivities: 'No activities yet.',

        // Home — Notice Board
        noticeBoard: 'Notice Board',
        announcement: 'Announcement',
        dailyThought: 'Daily Thought',
        noAnnouncement: 'No Announcement Yet',
        noDailyThought: 'No Daily Thought Yet',
        checkBackSoon: 'Check back soon for updates.',

        // Volunteer Modal
        volunteerApplication: 'Volunteer Application',
        applicationReceived: 'Application Received!',
        fullName: 'Full Name',
        mobile: 'Mobile',
        address: 'Address',
        pincode: 'Pincode',
        level: 'Level',
        serious: 'Serious',
        casual: 'Casual',
        submitApplication: 'Submit Application',
        verifying: 'Verifying...',
        detectingLocation: 'Detecting location...',
        geolocationNotSupported: 'Geolocation not supported.',
        locationVerified: (code) => `Location verified! Pincode: ${code}`,
        autofillFailed: 'Auto-detection failed. Please enter your Pincode manually below.',
        accessDenied: 'Location access denied.',
        failedSubmit: 'Failed to submit.',


        // Footer
        footerTagline: 'Empowering communities and building a better city together — one neighbourhood at a time.',
        followUs: 'Follow Us',
        contactUs: 'Contact Us',
        footerCopy: '© 2024 Nagar Vikas Samiti. All rights reserved.',
        footerMotto: 'Empowering Communities, Developing Cities.',

        // Admin & Leaders
        manageLeaders: 'Manage Leaders',
        addLeader: 'Add Leader',
        editLeader: 'Edit Leader',
        role: 'Role',
        ward: 'Ward Number/Name',
        councillor: 'Councillor',
        mp: 'MP',
        mla: 'MLA',
        saveLeader: 'Save Leader',
        updateLeader: 'Update Leader',
        wardRequiredOptions: 'Required for Councillor',
        performanceTracker: 'Performance Tracker',
        selectLeaderToView: 'Select a leader to view performance',
        promiseSlot: '📋 Promise Slot',
        realitySlot: '✅ Reality Slot',
        trackActualProgress: 'Reality tracking in progress...',
        amount: 'Amount',
        video: 'Video',
        chooseALeader: '-- Choose a Leader --',
        watchVideo: 'Watch Video',
        seeReality: 'See Reality',
        showReality: 'Show Reality',
        fullArea: 'Full Area/Location Details',
        submitReality: 'Submit for Approval',
        uploadImagesVideos: 'Upload Images or Videos',
        realitySubmitted: 'Reality report submitted! Waiting for admin approval.',
        allMonths: 'All Months',
        allYears: 'All Years',
        filterBy: 'Filter By',
        leaderType: 'Leader Type',
        months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],

    },
    hi: {
        // Navbar
        home: 'होम',
        ourLeaders: 'हमारे नेता',
        joinVolunteer: '🤝 स्वयंसेवक बनें',

        // Header
        orgName: 'नगर विकास समिति',

        // Home — Our Work
        ourWork: 'हमारा कार्य',
        images: 'चित्र',
        videos: 'वीडियो',
        noActivities: 'अभी तक कोई गतिविधि नहीं।',

        // Home — Notice Board
        noticeBoard: 'सूचना पट्ट',
        announcement: 'घोषणा',
        dailyThought: 'दैनिक विचार',
        noAnnouncement: 'अभी कोई घोषणा नहीं',
        noDailyThought: 'अभी कोई दैनिक विचार नहीं',
        checkBackSoon: 'जल्द ही अपडेट के लिए वापस देखें।',

        // Volunteer Modal
        volunteerApplication: 'स्वयंसेवक आवेदन',
        applicationReceived: 'आवेदन प्राप्त हुआ!',
        fullName: 'पूरा नाम',
        mobile: 'मोबाइल',
        address: 'पता',
        pincode: 'पिन कोड',
        level: 'स्तर',
        serious: 'गंभीर',
        casual: 'सामान्य',
        submitApplication: 'आवेदन जमा करें',
        verifying: 'सत्यापन हो रहा है...',
        detectingLocation: 'स्थान का पता लगाया जा रहा है...',
        geolocationNotSupported: 'जियोलोकेशन समर्थित नहीं है।',
        locationVerified: (code) => `स्थान सत्यापित! पिन कोड: ${code}`,
        autofillFailed: 'स्वतः पहचान विफल। कृपया नीचे पिन कोड दर्ज करें।',
        accessDenied: 'स्थान की अनुमति अस्वीकार।',
        failedSubmit: 'जमा करने में विफल।',


        // Footer
        footerTagline: 'समुदायों को सशक्त बनाना और मिलकर एक बेहतर शहर बनाना — एक मोहल्ले से एक कदम आगे।',
        followUs: 'हमें फ़ॉलो करें',
        contactUs: 'संपर्क करें',
        footerCopy: '© 2024 नगर विकास समिति। सर्वाधिकार सुरक्षित।',
        footerMotto: 'समुदायों को सशक्त बनाना, शहरों का विकास करना।',

        // Admin & Leaders
        manageLeaders: 'नेताओं का प्रबंधन',
        addLeader: 'नेता जोड़ें',
        editLeader: 'नेता संपादित करें',
        role: 'पद',
        ward: 'वार्ड नंबर/नाम',
        councillor: 'पार्षद',
        mp: 'सांसद (MP)',
        mla: 'विधायक (MLA)',
        saveLeader: 'नेता सहेजें',
        updateLeader: 'नेता अपडेट करें',
        wardRequiredOptions: 'पार्षद के लिए अनिवार्य',
        performanceTracker: 'प्रदर्शन ट्रैकर',
        selectLeaderToView: 'प्रदर्शन देखने के लिए एक नेता चुनें',
        promiseSlot: '📋 वादा स्लॉट',
        realitySlot: '✅ वास्तविकता स्लॉट',
        trackActualProgress: 'वास्तविकता ट्रैकिंग प्रगति पर है...',
        amount: 'राशि',
        video: 'वीडियो',
        chooseALeader: '-- एक नेता चुनें --',
        watchVideo: 'वीडियो देखें',
        seeReality: 'वास्तविकता देखें',
        showReality: 'वास्तविकता दिखाएं',
        fullArea: 'पूरा क्षेत्र/स्थान विवरण',
        submitReality: 'अनुमोदन के लिए जमा करें',
        uploadImagesVideos: 'चित्र या वीडियो अपलोड करें',
        realitySubmitted: 'वास्तविकता रिपोर्ट जमा की गई! व्यवस्थापक अनुमोदन की प्रतीक्षा है।',
        allMonths: 'सभी महीने',
        allYears: 'सभी वर्ष',
        filterBy: 'द्वारा फ़िल्टर करें',
        leaderType: 'नेता का प्रकार',
        months: ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],

    }
};

export const useT = (lang) => t[lang];
export default t;
