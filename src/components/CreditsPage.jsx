export default function CreditsPage() {
  const sections = [
    {
      title: 'Core Development',
      items: [
        {
          name: 'lzov',
          role: 'Founder & Owner & Lead Developer',
          description: 'Creator of Nocturnal UI',
        },
        {
            name: 'cover',
            role: 'Co-Owner & Internal UI Lead Developer & Founder ULTRAGUARD+',
            description: 'unprofessional skiddie',
        }
      ]
    },
    {
      title: 'Third-Party Libraries',
      items: [
        {
          name: 'Monaco Editor',
          description: 'Code editing component by Microsoft'
        },
        {
          name: 'React',
          description: 'UI library by Facebook'
        },
        {
          name: 'Electron',
          description: 'Desktop application framework'
        },
        {
          name: 'Tailwind CSS',
          description: 'Utility-first CSS framework'
        }
      ]
    },
    {
      title: 'Special Thanks',
      items: [
        {
          name: 'You!',
          description: 'For using Nocturnal UI and supporting our development'
        }
      ]
    }
  ];

  const renderItem = (item) => (
    <div key={item.name} className="py-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#FFFFF]">
              {item.name}
            </span>
            {item.role && (
              <span className="px-1.5 py-0.5 rounded text-xs bg-[#1a1a1a] text-gray-400">
                {item.role}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400 mt-1">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[#0e0e0e] overflow-y-auto py-6">
      <div className="max-w-3xl w-full mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold font-display mb-2">Credits</h1>
          <p className="text-sm text-gray-400">
            People and projects that made Nocturnal UI possible
          </p>
        </div>

        <div className="space-y-12">
          {sections.map(section => (
            <div key={section.title} className="mb-8">
              <h2 className="text-lg font-medium mb-4 pb-2 border-b border-white/20">
                {section.title}
              </h2>
              <div className="space-y-1 divide-y divide-[#222]">
                {section.items.map(renderItem)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[#222] text-center">
          <p className="text-sm text-gray-500">
            © 2025 Nocturnal UI. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Version 1.2.0-alpha.1
          </p>
        </div>
      </div>
    </div>
  );
}
