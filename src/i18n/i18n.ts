import React, { createContext, useContext } from 'react';

export type Locale = 'en' | 'te';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'te'];

export type TranslateParams = Record<string, string | number | undefined>;

const translations = {
  en: {
    languageName: 'English',
    nav: {
      home: 'Home',
      discover: 'Browse',
      cart: 'Cart',
      checkout: 'Checkout',
      orders: 'Orders',
      support: 'Support',
      call: 'Call',
      skipToContent: 'Skip to main content',
      toggleMenu: 'Toggle menu',
      openCart: 'Open cart',
      toggleTheme: 'Toggle theme',
      language: 'Language',
      english: 'EN',
      telugu: 'TE',
      callToOrder: 'Call to order',
      tagline: 'Ieeja supermarket delivery',
      signIn: 'Sign in',
      signOut: 'Sign out',
      adminConsole: 'Admin',
      riderConsole: 'Rider',
      account: 'Account',
    },
    hero: {
      badge: 'Ieeja’s neighborhood supermarket',
      title: 'Groceries from our Ieeja store delivered the same day.',
      description:
        'Pick vegetables, staples, and household basics from a simple list. Minimum order ₹100. Free delivery above ₹299; ₹15 fee otherwise.',
      startBrowsing: 'Start browsing',
      call: 'Call the store',
      highlightsTitle: 'In-store picks for today',
      highlightsDescription: 'Quick adds straight from our shelves. Tap a card to add supermarket staples to your basket.',
      highlightsLoading: 'Loading daily picks...',
      deliveryNote: 'Delivery windows: 11:30 AM • 6:30 PM. Free delivery above ₹299; ₹15 fee for smaller orders.',
    },
    metrics: [
      { label: 'Minimum order', value: '₹100' },
      { label: 'Free delivery from', value: '₹299' },
      { label: 'Delivery fee below ₹299', value: '₹15' },
    ],
    features: {
      title: 'Your Ieeja supermarket on call',
      description:
        'Daily essentials, produce, and household basics leave our shelves twice a day so you can skip the supermarket queue.',
      items: [
        {
          title: 'Simple ordering',
          description: 'Add everyday items from a supermarket-style list and submit in seconds.',
        },
        {
          title: 'Hyperlocal sourcing',
          description: 'We stock Ieeja favourites and trusted brands, restocked every morning.',
        },
        {
          title: 'Friendly delivery fee',
          description: '₹15 delivery below ₹299, and free delivery once your basket crosses the limit.',
        },
      ],
    },
    products: {
      title: 'Build your basket',
      description: 'Select essentials from each category and add them straight to your order summary. We’ll confirm and deliver the same day.',
      filters: {
        all: 'All items',
      },
      labels: {
        mrp: 'MRP {{price}}',
      },
      actions: {
        addToCart: 'Add to basket',
        viewCart: 'View cart',
      },
      stickySummary: '{{count}} item(s) in basket • {{total}}',
      detail: {
        goBack: 'Go back',
        missing: 'We couldn’t find this product. It may be unavailable right now.',
        backToDiscover: 'Browse all products',
        about: 'About this item',
        details: 'Product info',
        department: 'Department',
        category: 'Category',
        price: 'Price',
        mrp: 'MRP',
        mrpLabel: 'MRP {{price}}',
        unknown: 'Not specified',
        viewCart: 'View cart',
      },
      status: {
        loading: 'Loading fresh items...',
        error: 'Unable to load items right now. Please refresh later.',
        emptyAll: 'No items available right now. Please check back later.',
        emptyFilter: 'We are restocking {{department}} soon.',
        availableAll: '{{count}} item(s) available today.',
        availableAllWithNote: '{{count}} item(s) available today. {{note}}',
        availableDepartment: 'Showing {{count}} {{department}} pick(s).',
      },
      aria: {
        addToCart: 'Add {{name}} to basket',
      },
    },
    cart: {
      title: 'Review & confirm your order',
      description:
        'Your basket is shared with our fulfilment team instantly. We’ll call to confirm slot availability and payment preference.',
      empty: 'Your basket is empty. Browse the products page and add the staples you need for today’s delivery slot.',
      summaryTitle: 'Order summary',
      subtotal: 'Subtotal',
      deliveryNote: 'Free delivery within Ieeja on baskets above ₹299. Orders ₹100-₹298 have a ₹15 delivery fee.',
      proceedToCheckout: 'Continue to checkout',
      processingOrder: 'Processing order…',
      checkoutNote:
        'You’ll add delivery details and confirm payment at checkout before we submit your order to the team.',
      stickySummary: '{{count}} item(s) • {{total}}',
      aria: {
        decrease: 'Decrease {{name}}',
        increase: 'Increase {{name}}',
      },
    },
    checkout: {
      title: 'Checkout',
      description:
        'Complete the delivery details, choose how you’d like to pay, and confirm your order. We’ll call within 5 minutes to verify.',
      steps: {
        details: 'Delivery details',
        payment: 'Payment preference',
        review: 'Review & confirm',
      },
      forms: {
        nameLabel: 'Full name',
        namePlaceholder: 'Ayush Patel',
        phoneLabel: 'Phone number',
        phonePlaceholder: '98765 43210',
        addressLabel: 'Delivery address',
        addressPlaceholder: 'Flat 102, Green Residency, Ieeja',
        slotLabel: 'Preferred slot',
        slotPlaceholder: 'Select a slot',
        paymentLabel: 'Payment method',
        paymentPlaceholder: 'Select payment method',
        paymentCashOnDelivery: 'Cash on delivery',
        paymentUpi: 'UPI on delivery',
        instructionsLabel: 'Delivery instructions (optional)',
        instructionsPlaceholder: 'Ring the doorbell twice',
        requiredMessage: 'This field is required.',
      },
      validation: {
        invalidPhone: 'Enter a valid phone number with at least 6 digits.',
        quantityLimit: 'You can only add up to {{limit}} of each item. Adjust your basket before submitting.',
        fixErrors: 'Please fix the highlighted fields before continuing.',
      },
      review: {
        deliveryTitle: 'Delivery summary',
        basketTitle: 'Your basket',
        name: 'Name',
        phone: 'Phone',
        address: 'Address',
        slot: 'Slot',
        payment: 'Payment',
        total: 'Total due',
        notProvided: 'Not provided',
        emptyCart: 'Your cart is empty.',
        editCart: 'Edit basket',
      },
      aside: {
        nextStepsTitle: 'Next steps',
        nextStepsDescription:
          'Complete the current step to move forward. You can always go back to make changes.',
        reviewDescription: 'Confirm to submit your order. We will call to verify slot availability.',
        back: 'Back',
        continue: 'Continue',
        confirm: 'Confirm order',
        submitting: 'Submitting…',
        callout:
          'Need to make a phone order instead? Call {{phone}} and mention your basket items.',
      },
      stickySummary: 'Step {{step}} of {{total}} • {{totalAmount}}',
      toasts: {
        successTitle: 'Order placed',
        reference: 'Order ID: {{orderId}}',
        errorTitle: 'Order not submitted',
        errorDescription: 'Please try again or call the store.',
        emptyCartTitle: 'Cart is empty',
        emptyCartDescription: 'Add items to your cart before checking out.',
      },
      success: {
        title: 'Thanks! Your order is on its way',
        description: 'We’re preparing your basket now. You can review status from the Orders page.',
        reference: 'Reference: {{orderId}}',
        viewOrders: 'View orders',
        dismiss: 'Hide message',
        trackOrder: 'Track this order',
        newOrder: 'Start a new order',
        queued: 'Order queued for fulfilment',
        customer: 'For {{name}}',
      },
    },
    contact: {
      title: 'Need help with bulk or recurring orders?',
      description:
        'Reach out to schedule weekly staples, hostel provisions, or temple offerings. We’ll tailor delivery to your routine.',
      coverageTitle: 'Delivery coverage',
      coverageDescription:
        'Ieeja town, Gadwal bypass, Thimmapuram, Amaravai, and surrounding gram panchayats. Flexible slots for institutions and events.',
      coverageFee: '₹15 delivery fee for baskets below ₹299. Free delivery once you cross ₹299.',
      talkTitle: 'Talk to us',
      callLabel: 'Call: +91 98765 43210',
      whatsappLabel: 'WhatsApp: order.ieeja.com',
      emailLabel: 'support@ieeja.com',
      hours:
        'Business hours: Monday–Saturday 7 AM – 9 PM, Sunday 8 AM – 1 PM. Emergency orders? Call and we’ll accommodate if riders are available.',
    },
    orders: {
      title: 'Orders',
      description: 'Track past and current orders. We’ll keep this list updated once account sign-in launches.',
      requireAuthTitle: 'Sign in to see your orders',
      requireAuthDescription: 'Use your verified phone number to access order history and live fulfilment status.',
      signInCta: 'Go to sign in',
      placedOn: 'Placed {{date}}',
      status: {
        pending: 'Pending confirmation',
        confirmed: 'Confirmed',
        delivered: 'Delivered',
        outForDelivery: 'Out for delivery',
        cancelled: 'Cancelled',
      },
      summaryDelivered: 'Vegetables, dairy, and snacks',
      summaryOutForDelivery: 'Breakfast essentials',
      invoice: 'View invoice',
      reorder: 'Reorder items',
      loading: 'Loading orders…',
      refresh: 'Refresh',
      error: 'Unable to load orders right now.',
      retry: 'Try again',
      empty: 'No orders yet. Place your first order to see it here.',
      customerLine: 'Customer: {{name}}',
      customerPhone: 'Phone: {{phone}}',
      customerAddress: 'Address: {{address}}',
      deliverySlot: 'Delivery slot: {{slot}}',
      paymentMethod: 'Payment: {{method}}',
      deliveryInstructions: 'Notes: {{instructions}}',
    },
    support: {
      title: 'Support',
      description: 'Reach our fulfilment team anytime for slot updates, substitutions, or help with your account.',
    },
    account: {
      title: 'Account & saved addresses',
      description: 'Update your profile details and keep delivery addresses ready for faster checkout.',
      profileEyebrow: 'Profile',
      profileTitle: 'Contact preferences',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'Surya Reddy',
      displayNameLabel: 'Display name',
      displayNamePlaceholder: 'How ops teams refer to you',
      profileHelp: 'Phone number: {{phone}} (verified once OTP login launches).',
      saveProfile: 'Save profile',
      saving: 'Saving…',
      profileUpdated: 'Profile updated.',
      genericError: 'Something went wrong. Please try again.',
      addressEyebrow: 'Saved addresses',
      addressTitle: 'Delivery locations',
      addAddress: 'Add address',
      noAddresses: 'No addresses yet. Add one to speed up future orders.',
      defaultBadge: 'Default',
      setDefault: 'Set default',
      edit: 'Edit',
      delete: 'Delete',
      editAddressTitle: 'Edit address',
      newAddressTitle: 'New address',
      cancel: 'Cancel',
      addressCreated: 'Address saved.',
      addressUpdated: 'Address updated.',
      confirmDelete: 'Delete this address?',
      landmarkLabel: 'Landmark: {{landmark}}',
      saveAddress: 'Save address',
      loading: 'Loading account details…',
      profileUpdatedBanner: 'Profile updated.',
      addressForm: {
        label: 'Label (Home, Work)',
        contactName: 'Contact name',
        phone: 'Phone',
        line1: 'Address line 1',
        line1Required: 'Address line 1 is required.',
        line2: 'Address line 2',
        area: 'Area / locality',
        city: 'City / town',
        state: 'State',
        postalCode: 'PIN / Postal code',
        landmark: 'Landmark / delivery notes',
        makeDefault: 'Set as default',
        homeLabel: 'Home',
      },
    },
    footer: {
      left: '© {{year}} Order.Ieeja. Serving families across Ieeja & Gadwal district.',
      right: 'Cloudflare Pages • Same-day grocery logistics.',
    },
    floatingCall: {
      label: 'Call Order.Ieeja',
      aria: 'Call Order.Ieeja',
    },
    auth: {
      eyebrow: 'Account access',
      loginTitle: 'Sign in',
      loginDescription: 'Use the phone number and password you created during registration.',
      registerTitle: 'Create your Order.Ieeja account',
      registerDescription:
        'One account gives you customer order history today and staff dashboards (admin or rider) as we roll them out.',
      phoneLabel: 'Phone number',
      displayNameLabel: 'Display name (optional)',
      displayNamePlaceholder: 'Ayush Patel or Dispatch lead',
      displayNameHelper: 'Shown inside the admin and rider consoles.',
      passwordLabel: 'Password',
      passwordHelper: 'Minimum 8 characters. OTP-based resets are coming soon.',
      submitLogin: 'Sign in',
      submitRegister: 'Create account',
      helperText: 'OTP verification is next on the roadmap. For now, use your password to continue.',
      sidebarTitle: 'Why sign in?',
      sidebarHeadline: 'Unlock staff dashboards',
      sidebarBody:
        'Admins tweak delivery rules and track fulfilment. Riders sync their queue. Customers can review their order history.',
      nextStepsTitle: 'What happens next?',
      nextStepsLine1: 'We validate your session securely on Cloudflare.',
      nextStepsLine2: 'Admins land on their console, riders on the route view.',
      nextStepsLine3: 'Customers jump to the Orders page.',
      switchPrompt: 'Need a different flow?',
      switchToRegister: 'Create a new account',
      switchToLogin: 'Already have an account? Sign in',
      redirectNote: 'You will be redirected to {{destination}} after signing in.',
      validation: {
        phone: 'Enter a valid phone number with at least 6 digits.',
        password: 'Password must be at least 8 characters long.',
      },
      genericError: 'Unable to process the request right now.',
      submitting: 'Submitting…',
    },
  },
  te: {
    languageName: 'తెలుగు',
    nav: {
      home: 'హోమ్',
      discover: 'బ్రౌజ్',
      cart: 'కార్టు',
      checkout: 'చెక్కౌట్',
      orders: 'ఆర్డర్లు',
      support: 'సపోర్ట్',
      call: 'కాల్',
      skipToContent: 'ప్రధాన అంశాలకు వెళ్లండి',
      toggleMenu: 'మెను మార్చండి',
      openCart: 'కార్ట్ తెరవండి',
      toggleTheme: 'థీమ్ మార్చండి',
      language: 'భాష',
      english: 'EN',
      telugu: 'TE',
      callToOrder: 'ఆర్డర్ కోసం కాల్',
      tagline: 'ఈజా సూపర్‌మార్కెట్ డెలివరీ',
      signIn: 'లాగిన్',
      signOut: 'లాగౌట్',
      adminConsole: 'అడ్మిన్',
      riderConsole: 'రైడర్',
      account: 'ఖాతా',
    },
    hero: {
      badge: 'ఈజా పరిసర సూపర్‌మార్కెట్',
      title: 'మా ఈజా స్టోర్ నుండి అదే రోజున కిరాణా డెలివరీ.',
      description:
        'సులభమైన జాబితాలో కూరగాయలు, కిరాణా, హౌస్‌హోల్డ్ వస్తువులు ఎంచుకోండి. కనిష్ఠ ఆర్డర్ ₹100. ₹299 పైగా ఉచిత డెలివరీ; లేదంటే ₹15 ఫీజు.',
      startBrowsing: 'ఉత్పత్తులు చూడండి',
      call: 'స్టోర్ కు కాల్ చేయండి',
      highlightsTitle: 'ఈరోజు స్టోర్ ఎంపికలు',
      highlightsDescription:
        'మా షెల్ఫ్‌ల నుంచి నేరుగా వస్తువులు. సూపర్‌మార్కెట్ స్టేపిల్స్‌ని వెంటనే కార్ట్‌లో జోడించండి.',
      highlightsLoading: 'దైనందిన ఎంపికలు లోడ్ అవుతున్నాయి...',
      deliveryNote: 'డెలివరీ సమయాలు: 11:30 AM • 6:30 PM. ₹299 పైగా ఉచితం; మిగతా ఆర్డర్‌లకు ₹15 ఫీజు.',
    },
    metrics: [
      { label: 'కనిష్ఠ ఆర్డర్', value: '₹100' },
      { label: 'ఉచిత డెలివరీ', value: '₹299 పైగా' },
      { label: '₹299 లోపు ఫీజు', value: '₹15' },
    ],
    features: {
      title: 'మీ ఈజా సూపర్‌మార్కెట్ మీ ఇంటికే',
      description:
        'దినసరి అవసరాలు, కూరగాయలు, హౌస్‌హోల్డ్ వస్తువులు మా స్టోర్‌ నుండి రోజుకి రెండు సార్లు బయలుదేరుతాయి.',
      items: [
        {
          title: 'సులభ ఆర్డర్',
          description: 'సూపర్‌మార్కెట్ జాబితా నుండి అవసరమైన వస్తువులను చిటికెలో జోడించండి.',
        },
        {
          title: 'స్థానిక బ్రాండ్లు',
          description: 'ఈజా ఇష్టపడే బ్రాండ్లు, ఉదయం తాజా స్టాక్.',
        },
        {
          title: 'స్నేహపూర్వక ఫీజు',
          description: '₹299 లోపు ఆర్డర్‌లకు ₹15, దాని పైకి ఉచిత డెలివరీ.',
        },
      ],
    },
    products: {
      title: 'మీ సంచి సిద్ధం చేసుకోండి',
      description:
        'ప్రతి కేటగిరీ నుండి కావాల్సిన వస్తువులు ఎంచుకుని ఆర్డర్ సారాంశంలో జోడించండి. మేము నిర్ధారించి అదే రోజు డెలివరీ చేస్తాము.',
      filters: {
        all: 'అన్ని వస్తువులు',
      },
      labels: {
        mrp: 'ఎంఆర్‌పి {{price}}',
      },
      actions: {
        addToCart: 'కార్ట్‌లో జోడించండి',
        viewCart: 'కార్ట్ చూడండి',
      },
      stickySummary: '{{count}} వస్తువులు కార్ట్‌లో ఉన్నాయి • {{total}}',
      detail: {
        goBack: 'తిరిగి వెళ్ళండి',
        missing: 'ఈ ఉత్పత్తి లభ్యం కాలేదు. కొంతసేపటికి మళ్లీ ప్రయత్నించండి.',
        backToDiscover: 'అన్ని ఉత్పత్తులు చూడండి',
        about: 'ఈ ఉత్పత్తి గురించి',
        details: 'ఉత్పత్తి వివరాలు',
        department: 'శాఖ',
        category: 'కేటగిరీ',
        price: 'ధర',
        mrp: 'ఎంఆర్‌పి',
        mrpLabel: 'ఎంఆర్‌పి {{price}}',
        unknown: 'లభ్యం కాలేదు',
        viewCart: 'కార్ట్ చూడండి',
      },
      status: {
        loading: 'తాజా వస్తువులు లోడ్ అవుతున్నాయి...',
        error: 'ఇప్పుడు వస్తువులను లోడ్ చేయలేకపోతున్నాం. కొంతసేపటికి రీఫ్రెష్ చేయండి.',
        emptyAll: 'ప్రస్తుతం వస్తువులు అందుబాటులో లేవు. వెంటనే తిరిగి చూడండి.',
        emptyFilter: '{{department}} త్వరలో మళ్లీ స్టాక్ అవుతుంది.',
        availableAll: 'ఈరోజు {{count}} వస్తువు(లు) అందుబాటులో ఉన్నాయి.',
        availableAllWithNote: 'ఈరోజు {{count}} వస్తువు(లు) అందుబాటులో ఉన్నాయి. {{note}}',
        availableDepartment: '{{department}} నుండి {{count}} ఎంపిక(లు) చూపిస్తున్నాం.',
      },
      aria: {
        addToCart: '{{name}} ని కార్ట్‌లో జోడించండి',
      },
    },
    cart: {
      title: 'మీ ఆర్డర్‌ని సమీక్షించండి',
      description:
        'మీ కార్ట్ వెంటనే మా ఫుల్‌ఫిల్మెంట్ టీంతో పంచబడుతుంది. స్లాట్, చెల్లింపు కోసం మేమే మీకు కాల్ చేస్తాం.',
      empty: 'మీ కార్ట్ ఖాళీగా ఉంది. ఉత్పత్తులు పేజీ నుండి కావాల్సిన వస్తువులు జోడించండి.',
      summaryTitle: 'ఆర్డర్ సారాంశం',
      subtotal: 'సబ్‌టోటల్',
      deliveryNote: '₹299 పైగా బిల్లులకు ఉచిత డెలివరీ. ₹100-₹298 ఆర్డర్‌లకు ₹15 డెలివరీ ఫీజు.',
      proceedToCheckout: 'చెక్కౌట్‌కి కొనసాగండి',
      processingOrder: 'ఆర్డర్ ప్రాసెస్ అవుతోంది…',
      checkoutNote:
        'చెక్కౌట్‌లో డెలివరీ వివరాలు, చెల్లింపు విధానాన్ని నిర్ధారించిన తర్వాతే మా టీమ్‌కు ఆర్డర్ పంపబడుతుంది.',
      stickySummary: '{{count}} వస్తువులు • {{total}}',
      aria: {
        decrease: '{{name}} పరిమాణం తగ్గించండి',
        increase: '{{name}} పరిమాణం పెంచండి',
      },
    },
    checkout: {
      title: 'చెక్కౌట్',
      description:
        'డెలివరీ వివరాలు నింపి, చెల్లింపు మార్గం ఎంచుకుని ఆర్డర్‌ను నిర్ధారించండి. 5 నిమిషాల్లో మేము కాల్ చేసి ధృవీకరిస్తాం.',
      steps: {
        details: 'డెలివరీ వివరాలు',
        payment: 'చెల్లింపు ఎంపిక',
        review: 'సమీక్ష & నిర్ధారణ',
      },
      forms: {
        nameLabel: 'పూర్తి పేరు',
        namePlaceholder: 'ఉదా: అర్జున్ రావు',
        phoneLabel: 'ఫోన్ నంబర్',
        phonePlaceholder: '98765 43210',
        addressLabel: 'డెలివరీ చిరునామా',
        addressPlaceholder: 'ఫ్లాట్ 102, గ్రీన్ రెసిడెన్సీ, ఈజా',
        slotLabel: 'అభిరుచికి స్లాట్',
        slotPlaceholder: 'ఒక స్లాట్ ఎంచుకోండి',
        paymentLabel: 'చెల్లింపు విధానం',
        paymentPlaceholder: 'చెల్లింపు విధానం ఎంచుకోండి',
        paymentCashOnDelivery: 'డెలివరీపై నగదు',
        paymentUpi: 'డెలివరీపై UPI',
        instructionsLabel: 'డెలివరీ సూచనలు (ఐచ్చికం)',
        instructionsPlaceholder: 'దయచేసి రెండు సార్లు డోర్‌బెల్ మోగించండి',
        requiredMessage: 'ఈ వివరాన్ని తప్పనిసరిగా నింపండి.',
      },
      validation: {
        invalidPhone: 'కనీసం 6 అంకెలు ఉన్న సరైన ఫోన్ నంబర్‌ని నమోదు చేయండి.',
        quantityLimit: 'ప్రతి వస్తువును గరిష్ఠంగా {{limit}} వరకు మాత్రమే జోడించవచ్చు. ఆర్డర్ సమర్పించే ముందు కార్ట్‌ను సవరించండి.',
        fixErrors: 'దయచేసి హైలైట్ అయిన ఫీల్డులను సరిచేసి కొనసాగండి.',
      },
      review: {
        deliveryTitle: 'డెలివరీ సారాంశం',
        basketTitle: 'మీ కార్ట్',
        name: 'పేరు',
        phone: 'ఫోన్',
        address: 'చిరునామా',
        slot: 'స్లాట్',
        payment: 'చెల్లింపు',
        total: 'మొత్తం',
        notProvided: 'నింపలేదు',
        emptyCart: 'మీ కార్ట్ ఖాళీగా ఉంది.',
        editCart: 'కార్ట్ సవరించండి',
      },
      aside: {
        nextStepsTitle: 'తదుపరి చర్యలు',
        nextStepsDescription:
          'ప్రస్తుత దశను పూర్తిచేస్తే తరువాతకు వెళ్తారు. అవసరమైతే ఎప్పుడైనా వెనక్కి వచ్చి మార్చుకోవచ్చు.',
        reviewDescription: 'ఆర్డర్ పంపడానికి నిర్ధారించండి. స్లాట్ అందుబాటును మేము కాల్ చేసి ధృవీకరిస్తాం.',
        back: 'వెనక్కి',
        continue: 'కొనసాగించండి',
        confirm: 'ఆర్డర్ నిర్ధారించండి',
        submitting: 'సబ్మిట్ చేస్తున్నాం…',
        callout: 'ఫోన్ ద్వారా ఆర్డర్ చేయాలా? {{phone}} కి కాల్ చేసి మీ కార్ట్‌లో ఉన్న వస్తువులు చెప్పండి.',
      },
      stickySummary: 'దశ {{step}} / {{total}} • {{totalAmount}}',
      toasts: {
        successTitle: 'ఆర్డర్ నమోదైంది',
        reference: 'ఆర్డర్ ID: {{orderId}}',
        errorTitle: 'ఆర్డర్ నమోదు కాలేదు',
        errorDescription: 'మళ్లీ ప్రయత్నించండి లేదా స్టోర్‌కు కాల్ చేయండి.',
        emptyCartTitle: 'కార్ట్ ఖాళీగా ఉంది',
        emptyCartDescription: 'చెక్కౌట్‌కు ముందు వస్తువులను జోడించండి.',
      },
      success: {
        title: 'ధన్యవాదాలు! మీ ఆర్డర్ సిద్ధమవుతోంది',
        description: 'మేము మీ సరుకులను సిద్ధం చేస్తున్నాం. ఆర్డర్స్ పేజీలో స్థితిని చూడండి.',
        reference: 'సూచిక: {{orderId}}',
        viewOrders: 'ఆర్డర్స్ చూడండి',
        dismiss: 'సందేశం మూసివేయండి',
        trackOrder: 'ఈ ఆర్డర్‌ను ట్రాక్ చేయండి',
        newOrder: 'కొత్త ఆర్డర్ ప్రారంభించండి',
        queued: 'ఆర్డర్ ఫుల్‌ఫిల్మెంట్ క్యూలో ఉంది',
        customer: '{{name}} కోసం',
      },
    },
    contact: {
      title: 'బల్క్ లేదా పునరావృత ఆర్డర్లు కావాలా?',
      description:
        'వారాంతపు సరుకులు, హాస్టల్ సరఫరాలు, ఆలయ సమర్పణల కోసం మమ్మల్ని సంప్రదించండి. మీ షెడ్యూల్‌కు అనుగుణంగా డెలివరీ ప్లాన్ చేస్తాం.',
      coverageTitle: 'డెలివరీ పరిధి',
      coverageDescription:
        'ఈజా పట్టణం, గడ్వాల్ బైపాస్, తిమ్మాపురం, అమరవాయి మరియు చుట్టుపక్కల గ్రామపంచాయితీలు. సంస్థలు, ఈవెంట్ల కోసం ప్రత్యేక స్లాట్లు.',
      coverageFee: '₹299లోపు ఆర్డర్‌లకు ₹15 డెలివరీ. ₹299 పైగా అయితే ఉచితం.',
      talkTitle: 'మాతో మాట్లాడండి',
      callLabel: 'కాల్: +91 98765 43210',
      whatsappLabel: 'వాట్సాప్: order.ieeja.com',
      emailLabel: 'support@ieeja.com',
      hours:
        'సేవా సమయం: సోమవారం–శనివారం ఉదయం 7 – రాత్రి 9, ఆదివారం ఉదయం 8 – మధ్యాహ్నం 1. అత్యవసర ఆర్డర్ల కోసం కాల్ చేయండి.',
    },
    orders: {
      title: 'ఆర్డర్లు',
      description: 'గత, ప్రస్తుత ఆర్డర్లను ట్రాక్ చేయండి. లాగిన్ అందుబాటులోకి వచ్చిన తర్వాత ఇది ఆటోమేటిక్‌గా అప్‌డేట్ అవుతుంది.',
      requireAuthTitle: 'మీ ఆర్డర్లను చూడాలంటే లాగిన్ అవ్వండి',
      requireAuthDescription: 'ధృవీకరించిన ఫోన్ నంబర్‌తో లాగిన్ అయితే ఆర్డర్ చరిత్ర, లైవ్ స్థితి చూడవచ్చు.',
      signInCta: 'లాగిన్ పేజీకి వెళ్లండి',
      placedOn: '{{date}} న ఆర్డర్ పెట్టారు',
      status: {
        pending: 'ధృవీకరణ కోసం ఎదురు చూస్తోంది',
        confirmed: 'ధృవీకరించబడింది',
        delivered: 'డెలివర్ అయ్యింది',
        outForDelivery: 'డెలివరీకి బయలుదేరింది',
        cancelled: 'రద్దు చేయబడింది',
      },
      summaryDelivered: 'కూరగాయలు, పాల ఉత్పత్తులు, స్నాక్స్',
      summaryOutForDelivery: 'ఉదయం అల్పాహార అవసరాలు',
      invoice: 'ఇన్వాయిస్ చూడండి',
      reorder: 'మళ్లీ ఆర్డర్ చేయండి',
      loading: 'ఆర్డర్లు లోడ్ అవుతున్నాయి…',
      refresh: 'రిఫ్రెష్ చేయండి',
      error: 'ఇప్పుడే ఆర్డర్లను లోడ్ చేయలేకపోయాం.',
      retry: 'మళ్లీ ప్రయత్నించండి',
      empty: 'ఇప్పటికి ఆర్డర్లు లేవు. మీ మొదటి ఆర్డర్ ఇక్కడ కనిపిస్తుంది.',
      customerLine: 'వినియోగదారు: {{name}}',
      customerPhone: 'ఫోన్: {{phone}}',
      customerAddress: 'చిరునామా: {{address}}',
      deliverySlot: 'డెలివరీ స్లాట్: {{slot}}',
      paymentMethod: 'చెల్లింపు: {{method}}',
      deliveryInstructions: 'గమనికలు: {{instructions}}',
    },
    support: {
      title: 'సపోర్ట్',
      description: 'స్లాట్ అప్‌డేట్స్, ప్రత్యామ్నాయాలు, ఖాతా సహాయం కోసం ఎప్పుడైనా మా టీంను సంప్రదించండి.',
    },
    account: {
      title: 'ఖాతా & సేవ్ చేసిన అడ్రస్సులు',
      description: 'ప్రొఫైల్ వివరాలు నవీకరించండి, డెలివరీ అడ్రస్సులను సేవ్ చేసుకుని చెక్కౌట్ వేగంగా పూర్తి చేయండి.',
      profileEyebrow: 'ప్రొఫైల్',
      profileTitle: 'సంప్రదించడానికి వివరాలు',
      fullNameLabel: 'పూర్తి పేరు',
      fullNamePlaceholder: 'సూర్య రెడ్డి',
      displayNameLabel: 'డిస్ప్లే పేరు',
      displayNamePlaceholder: 'ఆప్స్ టీం మిమ్మల్ని ఎలా సంబోధిస్తుందో',
      profileHelp: 'ఫోన్ నంబర్: {{phone}} (OTP లాగిన్ వచ్చినప్పుడు ధృవీకరించబడుతుంది).',
      saveProfile: 'ప్రొఫైల్ సేవ్ చేయండి',
      saving: 'నిల్వ చేస్తోంది…',
      profileUpdated: 'ప్రొఫైల్ అప్‌డేట్ అయింది.',
      genericError: 'ఏదో తప్పు జరిగింది. కొంచెం తర్వాత మళ్లీ ప్రయత్నించండి.',
      addressEyebrow: 'సేవ్ చేసిన అడ్రస్సులు',
      addressTitle: 'డెలివరీ లొకేషన్‌లు',
      addAddress: 'అడ్రస్ జోడించండి',
      noAddresses: 'అడ్రస్సులు లేవు. భవిష్యత్ ఆర్డర్ల కోసం ఒకదాన్ని జోడించండి.',
      defaultBadge: 'డీఫాల్ట్',
      setDefault: 'డీఫాల్ట్ చేయి',
      edit: 'సవరించు',
      delete: 'తొలగించు',
      editAddressTitle: 'అడ్రస్ సవరించు',
      newAddressTitle: 'కొత్త అడ్రస్',
      cancel: 'రద్దు',
      addressCreated: 'అడ్రస్ సేవ్ అయింది.',
      addressUpdated: 'అడ్రస్ అప్‌డేట్ అయింది.',
      confirmDelete: 'ఈ అడ్రస్‌ను తొలగించాలా?',
      landmarkLabel: 'ల్యాండ్‌మార్క్: {{landmark}}',
      saveAddress: 'అడ్రస్ సేవ్ చేయండి',
      loading: 'ఖాతా వివరాలు లోడ్ అవుతున్నాయి…',
      addressForm: {
        label: 'లేబుల్ (హోమ్, వర్క్)',
        contactName: 'కాంటాక్ట్ పేరు',
        phone: 'ఫోన్',
        line1: 'అడ్రస్ లైన్ 1',
        line1Required: 'అడ్రస్ లైన్ 1 తప్పనిసరి.',
        line2: 'అడ్రస్ లైన్ 2',
        area: 'ఏరియా / లోకాలిటీ',
        city: 'టౌన్ / సిటీ',
        state: 'రాష్ట్రం',
        postalCode: 'పిన్ కోడ్',
        landmark: 'ల్యాండ్‌మార్క్ / డెలివరీ సూచనలు',
        makeDefault: 'డీఫాల్ట్‌గా ఉంచు',
        homeLabel: 'హోమ్',
      },
    },
    footer: {
      left: '© {{year}} Order.Ieeja. ఈజా మరియు గడ్వాల్ జిల్లాలో కుటుంబాలకు సేవ.',
      right: 'Cloudflare Pages • అదే రోజు గ్రోసరీ లాజిస్టిక్స్.',
    },
    floatingCall: {
      label: 'Order.Ieeja కి కాల్ చేయండి',
      aria: 'Order.Ieeja కి కాల్ చేయండి',
    },
    auth: {
      eyebrow: 'ఖాతా ప్రాప్తి',
      loginTitle: 'లాగిన్ అవ్వండి',
      loginDescription: 'నమోదులో ఇచ్చిన ఫోన్ నంబర్, పాస్‌వర్డ్ ఉపయోగించండి.',
      registerTitle: 'Order.Ieeja ఖాతాను సృష్టించండి',
      registerDescription:
        'ఒక ఖాతాతో కస్టమర్ ఆర్డర్లు, అడ్మిన్ నియంత్రణలు, రైడర్ కన్సోళ్లు అందుబాటులో ఉంటాయి.',
      phoneLabel: 'ఫోన్ నంబర్',
      displayNameLabel: 'పేరు (ఐచ్చికం)',
      displayNamePlaceholder: 'ఉదా: ప్రవీణ్ / స్టోర్ మేనేజర్',
      displayNameHelper: 'ఈ పేరు అడ్మిన్ & రైడర్ వ్యూలో కనిపిస్తుంది.',
      passwordLabel: 'పాస్‌వర్డ్',
      passwordHelper: 'కనీసం 8 అక్షరాలు. OTP రీసెట్ త్వరలో జతచేస్తాం.',
      submitLogin: 'లాగిన్',
      submitRegister: 'ఖాతాను సృష్టించండి',
      helperText: 'OTP ధృవీకరణ త్వరలో వస్తుంది. అప్పటివరకు పాస్‌వర్డ్‌తో కొనసాగండి.',
      sidebarTitle: 'ఎందుకు లాగిన్ చేయాలి?',
      sidebarHeadline: 'స్టాఫ్ డాష్‌బోర్డ్లు అన్‌లాక్ అవుతాయి',
      sidebarBody:
        'అడ్మిన్‌లు నియమాలు సవరించుకోగలరు, రైడర్‌లు తమ క్యూ చూస్తారు, కస్టమర్లు ఆర్డర్ చరిత్రను చూసిస్తారు.',
      nextStepsTitle: 'తర్వాత ఏమవుతుంది?',
      nextStepsLine1: 'Cloudflare మీద మీ సెషన్‌ను ధృవీకరిస్తాం.',
      nextStepsLine2: 'అడ్మిన్‌లు తమ కన్సోల్‌కి, రైడర్‌లు రూట్ వ్యూకి వెళ్తారు.',
      nextStepsLine3: 'కస్టమర్లు ఆర్డర్ పేజీకి తీసుకెళ్లబడతారు.',
      switchPrompt: 'ఇంకో ఎంపిక కావాలా?',
      switchToRegister: 'కొత్త ఖాతాను సృష్టించండి',
      switchToLogin: 'ఇప్పటికే ఖాతా ఉందా? లాగిన్ అవ్వండి',
      redirectNote: 'సైన్ ఇన్ తర్వాత {{destination}} కి మిమ్మల్ని తీసుకెళ్తాము.',
      validation: {
        phone: 'కనీసం 6 అంకెలతో ఫోన్ నంబర్ ఇవ్వండి.',
        password: 'పాస్‌వర్డ్ కనీసం 8 అక్షరాలు ఉండాలి.',
      },
      genericError: 'అభ్యర్థనను ప్రాసెస్ చేయలేకపోయాం.',
      submitting: 'సబ్మిట్ చేస్తున్నాం…',
    },
  },
} as const;

export type TranslationTree = (typeof translations)[Locale];

export type TranslationContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: TranslateParams) => string;
  dictionary: TranslationTree;
};

export const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

const PLACEHOLDER_PATTERN = /{{(\w+)}}/g;

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

export const interpolate = (template: string, params?: TranslateParams): string => {
  if (!params) {
    return template;
  }
  return template.replace(PLACEHOLDER_PATTERN, (_, key: string) => {
    const value = params[key];
    return value === undefined ? '' : String(value);
  });
};

export const translate = (dictionary: TranslationTree, path: string, params?: TranslateParams): string => {
  const value = getNestedValue(dictionary as unknown as Record<string, unknown>, path);
  if (typeof value === 'string') {
    return interpolate(value, params);
  }
  return '';
};

export const getDictionarySection = <T>(dictionary: TranslationTree, path: string): T | undefined => {
  const value = getNestedValue(dictionary as unknown as Record<string, unknown>, path);
  return value as T | undefined;
};

export const useTranslations = (): TranslationContextValue => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationContext.Provider');
  }
  return context;
};

export const TRANSLATIONS = translations;
