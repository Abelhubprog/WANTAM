import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';

/**
 * TrendingPosts component that displays a preview of trending social content
 */
export default function TrendingPosts() {
  // Mock data for trending posts
  const posts = [
    {
      id: 1,
      author: 'James Odhiambo',
      avatar: 'J',
      county: 'Nairobi',
      content: 'Just signed the #WANTAM pledge! One term is enough for any leader who fails to deliver. Our generation won\'t accept corruption and empty promises anymore.',
      timestamp: '2 hours ago',
      likes: 348,
      shares: 102,
      boosts: 54
    },
    {
      id: 2,
      author: 'Sarah Njeri',
      avatar: 'S',
      county: 'Kiambu',
      content: 'Organizing a WANTAM campus meetup at Kenyatta University next week. Join us and help spread the movement! Tag friends who should attend. #OneTermOnly #CleanSlate2027',
      timestamp: '5 hours ago',
      likes: 245,
      shares: 87,
      boosts: 41
    },
    {
      id: 3,
      author: 'Ahmed Hassan',
      avatar: 'A',
      county: 'Mombasa',
      content: 'Every shilling stolen is a hospital not built, a road not fixed, a child not educated. It\'s time for leaders who understand that public service is about SERVING, not enriching themselves. #WANTAM',
      timestamp: '1 day ago',
      likes: 529,
      shares: 203,
      boosts: 98
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-primary-black/95 to-primary-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Trending Posts</h2>
            <p className="text-white/70">See what Kenyans are saying about the movement</p>
          </div>
          <Button variant="outline" className="text-white border-white/20">
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-primary-black/70 border border-white/10 hover:border-white/20 transition-all">
              <CardHeader className="pb-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-kenyan-red/20 flex items-center justify-center mr-3">
                    <span className="text-white font-bold">{post.avatar}</span>
                  </div>
                  <div>
                    <p className="font-bold text-white">{post.author}</p>
                    <p className="text-white/60 text-sm">{post.county} • {post.timestamp}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-white/90 my-4">{post.content}</p>
                
                <div className="flex items-center justify-between mt-6 text-sm text-white/60">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {post.likes}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    {post.shares}
                  </div>
                  <div className="flex items-center text-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {post.boosts}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-white/80 mb-4">Ready to join the conversation?</p>
          <Link to="/pledge">
            <Button variant="default" size="lg" className="bg-kenyan-red hover:bg-kenyan-red/90">
              Sign the Pledge
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}