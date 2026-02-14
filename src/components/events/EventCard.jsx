import { Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price || 0);

const formatDate = (date) => {
  try {
    return new Date(date).toLocaleDateString('vi-VN');
  } catch {
    return 'TBA';
  }
};

const EventCard = ({ event }) => {
  if (!event) return null;

  const eventId = event._id || event.id;

  return (
    <Link
      to={`/events/${eventId}`}
      className="card card-hover overflow-hidden flex flex-col"
    >
      <div className="h-40 bg-gray-200 relative">
        {event.image || event.imageUrl ? (
          <img
            src={event.image || event.imageUrl}
            alt={event.title || event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-600 to-secondary-600" />
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4 mr-1" />
          <span>{formatDate(event.startDate || event.date)}</span>
        </div>

        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {event.title || event.name}
        </h3>

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="line-clamp-1">{event.location}</span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm text-gray-500">Giá từ</span>
          <span className="text-primary-600 font-bold">
            {formatPrice(event.lowestPrice || event.price)}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;

