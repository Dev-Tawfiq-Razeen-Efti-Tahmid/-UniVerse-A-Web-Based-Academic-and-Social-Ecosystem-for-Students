const channels = [
    {
        id: 101,
        type: 'Celestial Body',
        name: 'Nebula M78',
        value: 9.8,
        active: true,
        tags: ['space', 'galaxy', 'science']
    },
    {
        id: 204,
        type: 'Historical Figure',
        name: 'The Alchemist',
        value: 1620,
        active: false,
        tags: ['mystery', 'philosophy', 'fiction']
    },
    {
        id: 311,
        type: 'Programming Concept',
        name: 'Async Callback',
        value: 0.05,
        active: true,
        tags: ['javascript', 'node', 'non-blocking']
    },
    {
        id: 450,
        type: 'Mythical Creature',
        name: 'Gargoyle',
        value: 'Stone',
        active: false,
        tags: ['architecture', 'fantasy', 'guardian']
    },
    {
        id: 450,
        type: 'Mythical Creature',
        name: 'Gargoyle',
        value: 'Stone',
        active: false,
        tags: ['architecture', 'fantasy', 'guardian']
    },
    {
        id: 450,
        type: 'Mythical Creature',
        name: 'Gargoyle',
        value: 'Stone',
        active: false,
        tags: ['architecture', 'fantasy', 'guardian']
    },
    {
        id: 450,
        type: 'Mythical Creature',
        name: 'Gargoyle',
        value: 'Stone',
        active: false,
        tags: ['architecture', 'fantasy', 'guardian']
    },
];

export const showForumDashboard = (req, res) => {
  const userData = req.session?.userData;

  // If user is not logged in → redirect to login page
  if (!userData) {
    return res.redirect("/api/login");
  }

  // userData exists, so we can safely use username
  res.render("forumDash", { channels });
};
