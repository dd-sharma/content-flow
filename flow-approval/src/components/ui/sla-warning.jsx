import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { differenceInHours } from 'date-fns';
import { AlertTriangle, X, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Inlined function to bypass import issue
const createPageUrl = (pageName) => {
    return `/${pageName.toLowerCase()}`;
};

const SLAWarning = ({ reviews = [], contentItems = [] }) => {
  const [overdueItems, setOverdueItems] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // SLA is defined as 48 hours for this banner
    const SLA_HOURS = 48;
    
    const pendingReviews = reviews.filter(r => r.status === 'pending');
    
    const breachedItems = pendingReviews
      .map(review => {
        const hoursWaiting = differenceInHours(new Date(), new Date(review.created_date));
        if (hoursWaiting > SLA_HOURS) {
          const content = contentItems.find(c => c.id === review.content_item_id);
          return {
            ...content,
            review,
            hoursWaiting,
          };
        }
        return null;
      })
      .filter(Boolean); // Filter out nulls
      
    // Create a unique list of content items that have at least one breached review
    const uniqueBreachedItems = Array.from(new Map(breachedItems.map(item => [item.id, item])).values());

    setOverdueItems(uniqueBreachedItems);
    
    // Banner should only be potentially visible if there are overdue items
    if (uniqueBreachedItems.length === 0) {
      setIsVisible(false);
    }

  }, [reviews, contentItems]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }

  // Do not render if not visible or no overdue items
  if (!isVisible || overdueItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="glass-effect p-4 rounded-xl border border-orange-300 bg-orange-50/80 shadow-lg animate-in fade-in duration-500">
        <div className="flex items-center gap-2 md:gap-4">
          <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0" />
          <div className="flex-grow">
            <p className="font-semibold text-orange-800">
              {overdueItems.length} item{overdueItems.length > 1 ? 's have' : ' has'} exceeded the 48-hour SLA.
            </p>
            <p className="text-sm text-orange-700 hidden md:block">These items require immediate attention to prevent further delays.</p>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
             <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleExpand}
                className="text-orange-800 hover:bg-orange-100 h-10 px-2 md:px-4"
            >
                {isExpanded ? 'Hide' : 'Details'}
                {isExpanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 h-10 w-10"
            >
                <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-orange-200 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Overdue Items:</h4>
            <ul className="space-y-2">
              {overdueItems.map(item => (
                <li key={item.id} className="p-2 rounded-lg hover:bg-orange-100/70 transition-colors">
                  <Link 
                    to={createPageUrl(`ReviewQueue?content=${item.id}`)}
                    className="flex justify-between items-center"
                  >
                    <span className="font-medium text-slate-800">{item.title}</span>
                    <div className="flex items-center gap-1 text-xs text-red-600">
                        <Clock className="w-3 h-3"/>
                        <span>
                            Waiting for {item.hoursWaiting} hours
                        </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SLAWarning;