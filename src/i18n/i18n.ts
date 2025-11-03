import React, { createContext, useContext } from 'react';

export type Locale = 'en' | 'te';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'te'];

export type TranslateParams = Record<string, string | number | undefined>;

const translations = {
  en: {
    languageName: 'English',
    nav: {
      home: 'Home',
      discover: 'Discover',
      cart: 'Cart',
      checkout: 'Checkout',
      orders: 'Orders',
      support: 'Support',
      call: 'Call',
      toggleMenu: 'Toggle menu',
      openCart: 'Open cart',
      toggleTheme: 'Toggle theme',
      language: 'Language',
      english: 'EN',
      telugu: 'TE',
      callToOrder: 'Call to order',
      tagline: 'Fresh groceries delivered today',
    },
    hero: {
      badge: 'Ieeja’s fastest farm-to-home groceries',
      title: 'Dinner plans? We handpick & deliver groceries the same day.',
      description: 'Browse seasonal produce, pantry staples, and local favourites. Schedule a delivery window and we’ll do the rest.',
      startBrowsing: 'Start browsing',
      call: 'Call the store',
      highlightsTitle: 'Today’s handpicked items',
      highlightsDescription: 'Fresh arrivals curated from local farmers, dairies, and suppliers. Add them straight to your basket in Discover.',
      highlightsLoading: 'Loading daily picks...',
      deliveryNote: 'Delivery windows: 11:30 AM • 6:30 PM. Place your order at least 45 minutes before the slot.',
    },
    metrics: [
      { label: 'Households served', value: '180+' },
      { label: 'Same-day slots', value: '12' },
      { label: 'Free delivery from', value: '₹499' },
    ],
    features: {
      title: 'Your Ieeja grocery team on demand',
      description:
        'From school lunch staples to temple offerings, our riders cover town lanes and gram panchayats twice a day so you can skip the market rush.',
      items: [
        {
          title: 'Packed with care',
          description: 'Fresh greens, pulses, and dairy sealed airtight so they reach your doorstep crisp and cool.',
        },
        {
          title: 'Hyperlocal sourcing',
          description: 'We buy directly from Ieeja growers and trusted Gadwal wholesalers every morning.',
        },
        {
          title: 'Flexible ordering',
          description: 'Place online, WhatsApp, or phone orders. Pay online soon—cash on delivery today.',
        },
      ],
    },
    products: {
      title: 'Build your basket',
      description: 'Select essentials from each category and add them straight to your order summary. We’ll confirm and deliver the same day.',
      filters: {
        all: 'All items',
      },
      actions: {
        addToCart: 'Add to basket',
      },
      status: {
        loading: 'Loading fresh items...',
        error: 'Unable to load items right now. Please refresh later.',
        emptyAll: 'No items available right now. Please check back later.',
        emptyFilter: 'We are restocking {{category}} soon.',
        availableAll: '{{count}} item(s) available today.',
        availableAllWithNote: '{{count}} item(s) available today. {{note}}',
        availableCategory: 'Showing {{count}} {{category}} pick(s).',
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
      deliveryNote: 'Free delivery within Ieeja when your basket is above ₹499. Otherwise standard ₹40 fee applies.',
      proceedToCheckout: 'Continue to checkout',
      processingOrder: 'Processing order…',
      checkoutNote:
        'You’ll add delivery details and confirm payment at checkout before we submit your order to the team.',
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
      toasts: {
        successTitle: 'Order placed',
        reference: 'Order ID: {{orderId}}',
        errorTitle: 'Order not submitted',
        errorDescription: 'Please try again or call the store.',
        emptyCartTitle: 'Cart is empty',
        emptyCartDescription: 'Add items to your cart before checking out.',
      },
    },
    contact: {
      title: 'Need help with bulk or recurring orders?',
      description:
        'Reach out to schedule weekly staples, hostel provisions, or temple offerings. We’ll tailor delivery to your routine.',
      coverageTitle: 'Delivery coverage',
      coverageDescription:
        'Ieeja town, Gadwal bypass, Thimmapuram, Amaravai, and surrounding gram panchayats. Flexible slots for institutions and events.',
      coverageFee: 'Standard fee ₹40 below ₹499. Free delivery thereafter.',
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
    footer: {
      left: '© {{year}} Order.Ieeja. Serving families across Ieeja & Gadwal district.',
      right: 'Cloudflare Pages • Same-day grocery logistics.',
    },
    floatingCall: {
      label: 'Call Order.Ieeja',
      aria: 'Call Order.Ieeja',
    },
  },
  te: {
    languageName: 'తెలుగు',
    nav: {
      home: 'హోమ్',
      discover: 'ఉత్పత్తులు',
      cart: 'కార్టు',
      checkout: 'చెక్కౌట్',
      orders: 'ఆర్డర్లు',
      support: 'సపోర్ట్',
      call: 'కాల్',
      toggleMenu: 'మెను మార్చండి',
      openCart: 'కార్ట్ తెరవండి',
      toggleTheme: 'థీమ్ మార్చండి',
      language: 'భాష',
      english: 'EN',
      telugu: 'TE',
      callToOrder: 'ఆర్డర్ కోసం కాల్',
      tagline: 'ఈరోజే తాజా సరుకుల డెలివరీ',
    },
    hero: {
      badge: 'ఈజా నుంచి ఇంటికి వేగవంతమైన సరుకుల డెలివరీ',
      title: 'డిన్నర్ ప్లాన్స్? అదే రోజు మేమే తాజా సరుకులు ఎంపిక చేసి మీ ఇంటికి తెస్తాం.',
      description:
        'సీజన్ ఉత్పత్తులు, రోజూ వాడే సరుకులు, స్థానిక ఇష్టాలను బ్రౌజ్ చేసి డెలివరీ స్లాట్‌ని బుక్ చేసుకోండి. మిగతా పని మేమే చేస్తాము.',
      startBrowsing: 'ఉత్పత్తులు చూడండి',
      call: 'స్టోర్ కు కాల్ చేయండి',
      highlightsTitle: 'ఈరోజు మా ఎంపికలు',
      highlightsDescription:
        'స్థానిక రైతులు, పాల ఉత్పత్తిదారులు, సరఫరాదారుల నుంచి తాజా వస్తువులు. డిస్కవర్ పేజీలో వాటిని వెంటనే కార్ట్‌లో జోడించండి.',
      highlightsLoading: 'దైనందిన ఎంపికలు లోడ్ అవుతున్నాయి...',
      deliveryNote: 'డెలివరీ సమయాలు: ఉదయం 11:30 • సాయంత్రం 6:30. స్లాట్‌కు కనీసం 45 నిమిషాల ముందు ఆర్డర్ చేయండి.',
    },
    metrics: [
      { label: 'సేవలందించిన కుటుంబాలు', value: '180+' },
      { label: 'అదే రోజు స్లాట్లు', value: '12' },
      { label: '₹499 నుండి ఉచిత డెలివరీ', value: '₹499' },
    ],
    features: {
      title: 'మీ ఇంటి అవసరాలకు సిద్ధంగా ఉన్న ఈజా టీం',
      description:
        'పాఠశాల టిఫిన్ నుండి ఆలయ సమర్పణల వరకు, మా రైడర్లు రోజుకు రెండుసార్లు పట్టణ వీధులు, గ్రామపంచాయితీల వరకు సేవ చేస్తారు.',
      items: [
        {
          title: 'శ్రద్ధగా ప్యాక్ చేస్తాం',
          description: 'తాజా ఆకుకూరలు, పప్పులు, పాల ఉత్పత్తులను గాలి చొరబాటుని తట్టుకోకుండా ప్యాక్ చేసి చల్లగా మీ ఇంటికి చేరుస్తాం.',
        },
        {
          title: 'స్థానిక కొనుగోలు',
          description: 'ప్రతి ఉదయం ఈజా రైతులు మరియు నమ్మకమైన గడ్వాల్ హోల్‌సేల్ మార్కెట్‌ల నుండి నేరుగా కొనుగోలు చేస్తాం.',
        },
        {
          title: 'సులభ ఆర్డర్ మార్గాలు',
          description: 'ఆన్‌లైన్, వాట్సాప్ లేదా ఫోన్ ద్వారా ఆర్డర్ చేయండి. త్వరలో ఆన్‌లైన్ చెల్లింపులు; ప్రస్తుతం డెలివరీపై నగదు లేదా యూపీఐ.',
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
      actions: {
        addToCart: 'కార్ట్‌లో జోడించండి',
      },
      status: {
        loading: 'తాజా వస్తువులు లోడ్ అవుతున్నాయి...',
        error: 'ఇప్పుడు వస్తువులను లోడ్ చేయలేకపోతున్నాం. కొంతసేపటికి రీఫ్రెష్ చేయండి.',
        emptyAll: 'ప్రస్తుతం వస్తువులు అందుబాటులో లేవు. వెంటనే తిరిగి చూడండి.',
        emptyFilter: '{{category}} త్వరలో మళ్లీ స్టాక్ అవుతుంది.',
        availableAll: 'ఈరోజు {{count}} వస్తువు(లు) అందుబాటులో ఉన్నాయి.',
        availableAllWithNote: 'ఈరోజు {{count}} వస్తువు(లు) అందుబాటులో ఉన్నాయి. {{note}}',
        availableCategory: '{{category}} నుండి {{count}} ఎంపిక(లు) చూపిస్తున్నాం.',
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
      deliveryNote: '₹499 పైగా అయితే ఈజా పరిధిలో ఉచిత డెలివరీ. లేకపోతే సాధారణ ₹40 ఛార్జి.',
      proceedToCheckout: 'చెక్కౌట్‌కి కొనసాగండి',
      processingOrder: 'ఆర్డర్ ప్రాసెస్ అవుతోంది…',
      checkoutNote:
        'చెక్కౌట్‌లో డెలివరీ వివరాలు, చెల్లింపు విధానాన్ని నిర్ధారించిన తర్వాతే మా టీమ్‌కు ఆర్డర్ పంపబడుతుంది.',
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
      toasts: {
        successTitle: 'ఆర్డర్ నమోదైంది',
        reference: 'ఆర్డర్ ID: {{orderId}}',
        errorTitle: 'ఆర్డర్ నమోదు కాలేదు',
        errorDescription: 'మళ్లీ ప్రయత్నించండి లేదా స్టోర్‌కు కాల్ చేయండి.',
        emptyCartTitle: 'కార్ట్ ఖాళీగా ఉంది',
        emptyCartDescription: 'చెక్కౌట్‌కు ముందు వస్తువులను జోడించండి.',
      },
    },
    contact: {
      title: 'బల్క్ లేదా పునరావృత ఆర్డర్లు కావాలా?',
      description:
        'వారాంతపు సరుకులు, హాస్టల్ సరఫరాలు, ఆలయ సమర్పణల కోసం మమ్మల్ని సంప్రదించండి. మీ షెడ్యూల్‌కు అనుగుణంగా డెలివరీ ప్లాన్ చేస్తాం.',
      coverageTitle: 'డెలివరీ పరిధి',
      coverageDescription:
        'ఈజా పట్టణం, గడ్వాల్ బైపాస్, తిమ్మాపురం, అమరవాయి మరియు చుట్టుపక్కల గ్రామపంచాయితీలు. సంస్థలు, ఈవెంట్ల కోసం ప్రత్యేక స్లాట్లు.',
      coverageFee: '₹499 కంటే తక్కువైతే డెలివరీ ఛార్జ్ ₹40. అంతకు మించి ఉచితం.',
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
    footer: {
      left: '© {{year}} Order.Ieeja. ఈజా మరియు గడ్వాల్ జిల్లాలో కుటుంబాలకు సేవ.',
      right: 'Cloudflare Pages • అదే రోజు గ్రోసరీ లాజిస్టిక్స్.',
    },
    floatingCall: {
      label: 'Order.Ieeja కి కాల్ చేయండి',
      aria: 'Order.Ieeja కి కాల్ చేయండి',
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
