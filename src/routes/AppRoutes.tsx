import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginExtranet from '../pages/LoginExtranet';
import ProtectedRoute from '../components/ProtectedRoute';
import ExtranetLayout from '../layouts/ExtranetLayout';
import Dashboard from '../pages/extranet/Dashboard';
import ExtranetActivities from '../pages/extranet/ActivityList';
import SpecialOffers from '../pages/extranet/SpecialOffers';
import Availability from '../pages/extranet/Availability';
import Bookings from '../pages/extranet/Bookings';
import TicketScanner from '../pages/extranet/TicketScanner';
import Reviews from '../pages/extranet/Reviews';
import Analytics from '../pages/extranet/Analytics';
import Suggestions from '../pages/extranet/Suggestions';
import Finances from '../pages/extranet/Finances';
import StepCategory from '../pages/extranet/create_activity/StepCategory';
import StepTitle from '../pages/extranet/create_activity/StepTitle';
import StepDescription from '../pages/extranet/create_activity/StepDescription';
import StepRecommendation from '../pages/extranet/create_activity/StepRecommendation';
import StepRestriction from '../pages/extranet/create_activity/StepRestriction';
import StepInclude from '../pages/extranet/create_activity/StepInclude';
import StepNotInclude from '../pages/extranet/create_activity/StepNotInclude';
import StepImages from '../pages/extranet/create_activity/StepImages';
import StepOptions from '../pages/extranet/create_activity/StepOptions';
import StepItinerary from '../pages/extranet/create_activity/StepItinerary';
import StepOptionSetup from '../pages/extranet/create_activity/StepOptionSetup';
import StepOptionMeetingPickup from '../pages/extranet/create_activity/StepOptionMeetingPickup';
import StepOptionAvailabilityPrice from '../pages/extranet/create_activity/StepOptionAvailabilityPrice';
import StepOptionAvailabilityPricingDepartureTime from '../pages/extranet/create_activity/StepOptionAvailabilityPricingDepartureTime';
import StepOptionCutOff from '../pages/extranet/create_activity/StepOptionCutOff';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LoginExtranet />} />

      {/* Extranet Routes */}
      <Route path="/extranet" element={
        <ProtectedRoute>
          <ExtranetLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="list-activities" element={<ExtranetActivities />} />
        <Route path="special-offers" element={<SpecialOffers />} />
        <Route path="availability" element={<Availability />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="ticket-scanner" element={<TicketScanner />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="suggestions" element={<Suggestions />} />
        <Route path="finances" element={<Finances />} />
        <Route path="activity/createCategory" element={<StepCategory />} />
        <Route path="activity/createTitle" element={<StepTitle />} />
        <Route path="activity/createDescription" element={<StepDescription />} />
        <Route path="activity/createRecommendations" element={<StepRecommendation />} />
        <Route path="activity/createRestrictions" element={<StepRestriction />} />
        <Route path="activity/createInclude" element={<StepInclude />} />
        <Route path="activity/createNotIncluded" element={<StepNotInclude />} />
        <Route path="activity/createImages" element={<StepImages />} />
        <Route path="activity/createOptions" element={<StepOptions />} />
        <Route path="activity/createItinerary" element={<StepItinerary />} />
        <Route path="activity/createOptionSetup" element={<StepOptionSetup />} />
        <Route path="activity/createOptionMeetingPickup" element={<StepOptionMeetingPickup />} />
        <Route path="activity/availabilityPricing" element={<StepOptionAvailabilityPrice />} />
        <Route path="activity/availabilityPricing/create" element={<StepOptionAvailabilityPricingDepartureTime />} />
        <Route path="activity/cutOff" element={<StepOptionCutOff />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 