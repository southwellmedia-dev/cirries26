export interface NavLink {
  label: string;
  href: string;
  description?: string;
  highlighted?: boolean;
}

export interface NavColumn {
  title: string;
  href?: string;
  links?: NavLink[];
}

export interface NavItem {
  label: string;
  href?: string;
  type: 'link' | 'dropdown' | 'megamenu';
  columns?: NavColumn[];
  links?: NavLink[];
}

export const mainNavigation: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    type: 'link'
  },
  {
    label: 'Solutions',
    href: '/solutions',
    type: 'megamenu',
    columns: [
      {
        title: 'Intelligent Network Observability',
        href: '/solutions/intelligent-network-observability',
        links: [
          { label: 'DART AI', href: '/solutions/intelligent-network-observability/dart-ai' },
          { label: 'Gen AI', href: '/solutions/intelligent-network-observability/gen-ai' },
          { label: 'Machine Learning AI', href: '/solutions/intelligent-network-observability/machine-learning-engine' },
          { label: 'Agentic AI', href: '/solutions/intelligent-network-observability/agentic-ai', highlighted: true }
        ]
      },
      {
        title: 'Connectivity & Performance',
        href: '/solutions/connectivity-performance',
        links: [
          { label: 'Home Broadband', href: '/solutions/connectivity-performance/home-broadband' },
          { label: 'IoT', href: '/solutions/connectivity-performance/iot' },
          { label: 'Private Network', href: '/solutions/connectivity-performance/private-network' },
          { label: 'Cloud Monitoring', href: '/solutions/connectivity-performance/cloud-monitoring' },
          { label: 'Mobile', href: '/solutions/connectivity-performance/mobile' }
        ]
      },
      {
        title: 'Network Detection & Response',
        href: '/solutions/network-detection-response',
        links: [
          { label: 'Sensors', href: '/solutions/network-detection-response/sensors' },
          { label: 'Anomaly Detection', href: '/solutions/network-detection-response/anomaly-detection' },
          { label: 'Observability', href: '/solutions/network-detection-response/observability' }
        ]
      },
      {
        title: 'SLA Assurance & Reporting',
        href: '/solutions/sla-assurance-reporting',
        links: [
          { label: 'SLA Assurance', href: '/solutions/sla-assurance-reporting/sla-assurance' },
          { label: 'Reporting', href: '/solutions/sla-assurance-reporting/reporting' }
        ]
      }
    ]
  },
  {
    label: 'Use Cases',
    href: '/use-cases',
    type: 'dropdown',
    links: [
      {
        label: 'Medical Device Network Reliability',
        href: '/use-cases/medical-device-network-reliability',
        description: 'Private 5G for surgical robotics'
      },
      {
        label: 'Hospital Network Enhancement',
        href: '/use-cases/hospital-network-enhancement',
        description: 'Digital health systems optimization'
      },
      {
        label: 'Network Operator Experience',
        href: '/use-cases/network-operator-experience',
        description: 'Hybrid & 5G infrastructure'
      }
    ]
  },
  {
    label: 'Resources',
    href: '/resources',
    type: 'dropdown',
    links: [
      {
        label: 'All Resources',
        href: '/resources',
        description: 'Data sheets, briefs & more'
      },
      {
        label: 'Industries',
        href: '/industries',
        description: 'Solutions by industry'
      },
      {
        label: 'Blog',
        href: '/blog',
        description: 'Latest news and insights'
      }
    ]
  },
  {
    label: 'Company',
    href: '/about',
    type: 'dropdown',
    links: [
      {
        label: 'About',
        href: '/about',
        description: 'Our mission and story'
      },
      {
        label: 'Contact Us',
        href: '/contact',
        description: 'Get in touch'
      }
    ]
  }
];

export const footerNavigation = {
  solutions: [
    { label: 'DART AI', href: '/solutions/dart-ai' },
    { label: 'Intelligent Network Management', href: '/solutions/intelligent-network-management' },
    { label: 'Connectivity & Performance', href: '/solutions/connectivity-performance' },
    { label: 'Network Detection & Response', href: '/solutions/network-detection-response' },
    { label: 'SLA Assurance & Reporting', href: '/solutions/sla-assurance-reporting' }
  ],
  useCases: [
    { label: 'Medical Device Network Reliability', href: '/use-cases/medical-device-network-reliability' },
    { label: 'Hospital Network Enhancement', href: '/use-cases/hospital-network-enhancement' },
    { label: 'Network Operator Experience', href: '/use-cases/network-operator-experience' }
  ],
  resources: [
    { label: 'All Resources', href: '/resources' },
    { label: 'Industries', href: '/industries' },
    { label: 'Blog', href: '/blog' }
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Contact Us', href: '/contact' }
  ]
};
