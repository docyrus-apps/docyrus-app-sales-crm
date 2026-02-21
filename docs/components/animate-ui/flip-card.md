# Flip Card

URL: /docs/components/community/flip-card

---

title: Flip Card
description: A 3D animated card component that flips to reveal content on the back.
author:
name: Divyashri
url: [https://github.com/DivyashriRavichandran](https://github.com/DivyashriRavichandran)
releaseDate: 2025-11-13

---

<ComponentPreview name="demo-components-community-flip-card" />

## Installation

<ComponentInstallation name="demo-components-community-flip-card" />

## Usage

```tsx
'use client'

import { FlipCard } from '@/components/animate-ui/components/community/flip-card'

const data = {
  name: 'Animate UI',
  username: 'animate_ui',
  image:
    'https://pbs.twimg.com/profile_images/1950218390741618688/72447Y7e_400x400.jpg',
  bio: 'A fully animated, open-source component distribution built with React, TypeScript, Tailwind CSS, and Motion.',
  stats: { following: 200, followers: 2900, posts: 120 },
  socialLinks: {
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
  },
}

export const FlipCardDemo = () => {
  return <FlipCard data={data} />
}
```

## API Reference

### FlipCard

<TypeTable
type={{
  data: {
    description:
      'The data object containing all information to display on the card, including user info, stats, and social links.',
    type: 'FlipCardData',
    required: true,
  },
}}
/>

### FlipCardData

<TypeTable
type={{
  name: {
    description: 'Full name of the person.',
    type: 'string',
    required: true,
  },
  username: {
    description: 'Username or handle of the person.',
    type: 'string',
    required: true,
  },
  image: {
    description: 'URL of the profile image.',
    type: 'string',
    required: true,
  },
  bio: {
    description: 'Short biography or description.',
    type: 'string',
    required: true,
  },
  stats: {
    description:
      'Object containing statistics such as following, followers, and optionally posts.',
    type: '{ following: number; followers: number; posts?: number }',
    required: true,
  },
  socialLinks: {
    description:
      'Optional object containing social profile links for LinkedIn, GitHub, and Twitter.',
    type: '{ linkedin?: string; github?: string; twitter?: string }',
    required: false,
  },
}}
/>
