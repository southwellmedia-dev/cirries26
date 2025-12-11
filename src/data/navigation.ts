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
        label: 'Enterprise Networks',
        href: '/use-cases/enterprise',
        description: 'Large-scale network management'
      },
      {
        label: 'Service Providers',
        href: '/use-cases/service-providers',
        description: 'Carrier-grade visibility'
      },
      {
        label: 'Mobile Carriers',
        href: '/use-cases/mobile-carriers',
        description: 'Mobile network optimization'
      },
      {
        label: 'Government & Defense',
        href: '/use-cases/government',
        description: 'Secure government solutions'
      }
    ]
  },
  {
    label: 'Resources',
    href: '/resources',
    type: 'dropdown',
    links: [
      {
        label: 'Documentation',
        href: '/resources/docs',
        description: 'Technical guides and API reference'
      },
      {
        label: 'Case Studies',
        href: '/resources/case-studies',
        description: 'Customer success stories'
      },
      {
        label: 'White Papers',
        href: '/resources/white-papers',
        description: 'In-depth research and analysis'
      },
      {
        label: 'Blog',
        href: '/resources/blog',
        description: 'Latest news and insights'
      },
      {
        label: 'Webinars',
        href: '/resources/webinars',
        description: 'Live and on-demand sessions'
      }
    ]
  },
  {
    label: 'About',
    href: '/about',
    type: 'dropdown',
    links: [
      {
        label: 'Our Story',
        href: '/about/story',
        description: 'Our mission and journey'
      },
      {
        label: 'Team',
        href: '/about/team',
        description: 'Meet our leadership'
      },
      {
        label: 'Careers',
        href: '/about/careers',
        description: 'Join our team'
      },
      {
        label: 'News',
        href: '/about/news',
        description: 'Press releases and updates'
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
    { label: 'Enterprise Networks', href: '/use-cases/enterprise' },
    { label: 'Service Providers', href: '/use-cases/service-providers' },
    { label: 'Mobile Carriers', href: '/use-cases/mobile-carriers' },
    { label: 'Government & Defense', href: '/use-cases/government' }
  ],
  resources: [
    { label: 'Documentation', href: '/resources/docs' },
    { label: 'Case Studies', href: '/resources/case-studies' },
    { label: 'White Papers', href: '/resources/white-papers' },
    { label: 'Blog', href: '/resources/blog' },
    { label: 'Webinars', href: '/resources/webinars' }
  ],
  company: [
    { label: 'Our Story', href: '/about/story' },
    { label: 'Team', href: '/about/team' },
    { label: 'Careers', href: '/about/careers' },
    { label: 'News', href: '/about/news' },
    { label: 'Contact', href: '/contact' }
  ]
};
