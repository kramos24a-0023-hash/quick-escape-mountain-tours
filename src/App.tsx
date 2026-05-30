import { useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Mail,
  MapPin,
  Mountain,
  Phone,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { InquiryMessaging } from "./InquiryMessaging";

type Adventure = {
  title: string;
  description: string;
  Icon: typeof Mountain;
};

type TabId =
  | "overview"
  | "river"
  | "atv"
  | "mountain"
  | "gallery"
  | "promo"
  | "contact"
  | "messages";

const contact = {
  phone: "0918 935 3692",
  email: "quickescapesamontalban@gmail.com",
  facebook: "https://www.facebook.com/quickescapeMT",
  location: "Barangay Puray, Rodriguez, Philippines, 1860",
};

const assets = {
  logo: "/quick-escape-logo.jpg",
  atv: "/quick-escape-atv-lineup.jpg",
  river: "/quick-escape-river-trekking.png",
  video: "/quick-escape-promo.mp4",
  videoTwo: "/quick-escape-promo-2.mp4",
  videoThree: "/quick-escape-promo-3.mp4",
  riverVideo: "/quick-escape-river-video.mp4",
  atvVideo: "/quick-escape-atv-video.mp4",
  mountainVideo: "/quick-escape-mountain-video.mp4",
  promoCollage: "/quick-escape-promo-collage.jpg",
  mtOroGuests: "/quick-escape-mt-oro-guests.jpg",
  accreditation: "/quick-escape-accreditation.jpg",
  atvSunset: "/quick-escape-atv-sunset.jpg",
  ridersGroup: "/quick-escape-riders-group.jpg",
  jumpShot: "/quick-escape-jump-shot.jpg",
};

const galleryPhotos = [
  {
    src: assets.promoCollage,
    title: "Summer Promo",
    caption: "2500 per day, 7am to 3pm, guide and gas included.",
  },
  {
    src: assets.mtOroGuests,
    title: "Mt. Oro Viewpoint",
    caption: "Guest photos at one of Montalban's most scenic stops.",
  },
  {
    src: assets.ridersGroup,
    title: "Happy Riders",
    caption: "Real guests, helmets ready, mountain view behind them.",
  },
  {
    src: assets.jumpShot,
    title: "Fun Stopovers",
    caption: "Photo-worthy moments built into the route.",
  },
  {
    src: assets.atvSunset,
    title: "ATV Trail Views",
    caption: "Rugged units, open sky, and ridge-top scenery.",
  },
  {
    src: assets.accreditation,
    title: "Community Presence",
    caption: "Partnership and accreditation proof for guest confidence.",
  },
];

const galleryVideos = [
  {
    src: assets.video,
    poster: assets.atv,
    title: "Trail Preview",
  },
  {
    src: assets.videoTwo,
    poster: assets.river,
    title: "Guest Experience",
  },
  {
    src: assets.videoThree,
    poster: assets.mtOroGuests,
    title: "Mountain Moments",
  },
];

const tabs: { id: TabId; label: string }[] = [
  { id: "gallery", label: "Gallery" },
  { id: "overview", label: "Overview" },
  { id: "river", label: "River Trekking" },
  { id: "atv", label: "ATV Adventure" },
  { id: "mountain", label: "Mountain Tours" },
  { id: "promo", label: "Promo" },
  { id: "contact", label: "Contact" },
  { id: "messages", label: "Messages" },
];

const activityPages: Record<"river" | "atv" | "mountain", Adventure & {
  eyebrow: string;
  promise: string;
  video: string;
  poster: string;
  activities: string[];
  fulfillment: string[];
}> = {
  river: {
    title: "River Trekking",
    eyebrow: "Wet trails, stream beds, and waterfalls",
    description:
      "Move upstream through Montalban's river routes with guided pacing, natural obstacles, and cool water breaks.",
    promise:
      "Guests leave with the feeling of discovering a side of nature they cannot reach from the roadside.",
    Icon: Waves,
    video: assets.riverVideo,
    poster: assets.river,
    activities: [
      "Stream walking and shallow water crossings",
      "Rock scrambling over natural river terrain",
      "Waterfall and canyon-style photo stops",
      "Guide-led pacing for beginners and groups",
    ],
    fulfillment: [
      "A refreshing escape from the city",
      "Confidence from finishing a physical outdoor route",
      "Raw nature photos and shared group memories",
    ],
  },
  atv: {
    title: "ATV Adventure",
    eyebrow: "Engines, ridges, dirt roads, and views",
    description:
      "Ride rugged ATV units through mountain routes with guide coordination, safety reminders, and scenic stopovers.",
    promise:
      "Guests get the thrill of movement, the freedom of open views, and the satisfaction of reaching the ridge.",
    Icon: Compass,
    video: assets.atvVideo,
    poster: assets.atv,
    activities: [
      "ATV ride orientation before departure",
      "Guided trail riding through Montalban routes",
      "Viewpoint stops for photos and rest",
      "Group-friendly pacing for first-time riders",
    ],
    fulfillment: [
      "Adventure without complicated planning",
      "A bold weekend story with photos to prove it",
      "Shared excitement for barkada and family groups",
    ],
  },
  mountain: {
    title: "Mountain Tours",
    eyebrow: "Scenic stops, local routes, and easy planning",
    description:
      "Explore mountain destinations around Barangay Puray and nearby routes with a local team handling the details.",
    promise:
      "Guests come home lighter, recharged, and connected to the mountains of Montalban.",
    Icon: Mountain,
    video: assets.mountainVideo,
    poster: assets.mtOroGuests,
    activities: [
      "Mountain viewpoint visits",
      "Photo stops at recognizable Montalban landmarks",
      "Relaxed nature touring for mixed groups",
      "Local route coordination and schedule planning",
    ],
    fulfillment: [
      "Peaceful mountain air and wide-open scenery",
      "Low-stress travel with the route already handled",
      "Meaningful moments with friends, family, or teams",
    ],
  },
};

const inclusions = [
  "Online booking and reservations",
  "Tour guide coordination",
  "Mountain and river route planning",
  "Group-friendly adventure support",
  "Montalban tourism-accredited operator",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("gallery");
  const whatsapp = `https://wa.me/63${contact.phone.replace(/\D/g, "").slice(1)}`;

  return (
    <main className="appShell">
      <section className="heroPanel">
        <img
          className="heroImage"
          src={assets.atv}
          alt="Quick Escape ATV units lined up on a scenic mountain trail"
          onError={(event) => {
            event.currentTarget.src = assets.river;
          }}
        />
        <div className="heroOverlay" />

        <header className="topBar">
          <a className="brand" href="/" aria-label="Quick Escape home">
            <span className="brandLogo">
              <img
                src={assets.logo}
                alt="Quick Escape Mountain Tours logo"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <Mountain aria-hidden="true" />
            </span>
            <span>
              <strong>Quick Escape</strong>
              <small>Mountain Tours</small>
            </span>
          </a>

          <div className="topActions">
            <a className="ghostButton" href={`mailto:${contact.email}`}>
              <Mail aria-hidden="true" />
              Email
            </a>
            <a className="solidButton" href="tel:09189353692">
              <Phone aria-hidden="true" />
              Call now
            </a>
          </div>
        </header>

        <div className="heroContent">
          <p className="eyebrow">
            <Waves aria-hidden="true" />
            River trekking and ATV adventures in Montalban
          </p>
          <h1>Ride higher. Trek deeper. Escape ordinary weekends.</h1>
          <p>
            Quick Escape by 29 Sierras Escapade Tour Services creates guided
            river trekking, ATV, and mountain adventures in Rodriguez, Montalban.
          </p>
          <div className="heroActions">
            <a className="solidButton large" href={whatsapp}>
              Reserve your slot
              <ChevronRight aria-hidden="true" />
            </a>
            <button
              className="ghostButton large"
              type="button"
              onClick={() => setActiveTab("gallery")}
            >
              View gallery
            </button>
          </div>
        </div>
      </section>

      <section className="contentPanel" aria-label="Quick Escape information">
        <div className="metricStrip">
          <Metric label="Followers" value="3.4K" />
          <Metric label="Booking" value="Online + reservations" />
          <Metric label="Location" value="Barangay Puray" />
        </div>

        <div className="tabs" role="tablist" aria-label="Quick Escape sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? "tab active" : "tab"}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tabBody">
          {activeTab === "overview" && <OverviewTab />}
          {activeTab === "river" && <ActivityTab activity={activityPages.river} />}
          {activeTab === "atv" && <ActivityTab activity={activityPages.atv} />}
          {activeTab === "mountain" && <ActivityTab activity={activityPages.mountain} />}
          {activeTab === "gallery" && <GalleryTab />}
          {activeTab === "promo" && <PromoTab />}
          {activeTab === "contact" && <ContactTab onOpenInquiry={() => setActiveTab("messages")} />}
          {activeTab === "messages" && <InquiryMessaging />}
        </div>
      </section>

      <button
        className="floatingInquiryButton"
        type="button"
        onClick={() => setActiveTab("messages")}
      >
        <Mail aria-hidden="true" />
        Message Us
      </button>
    </main>
  );
}

function OverviewTab() {
  return (
    <div className="overviewStack">
      <div className="tabGrid">
        <div className="copyBlock">
          <p className="sectionLabel">The Heart Of Quick Escape</p>
          <h2>We do not just bring guests to places. We bring them back to themselves.</h2>
          <p>
            Quick Escape was built for people who need fresh air, honest
            adventure, and memories that feel alive. Every route is planned so
            guests can feel safe, welcomed, and proud of what they experienced.
          </p>
          <div className="checkGrid">
            {inclusions.map((item) => (
              <span key={item}>
                <CheckCircle2 aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="featureCard dark">
          <ShieldCheck aria-hidden="true" />
          <h3>Tourism-listed operator</h3>
          <p>
            29 Sierras Escapade Tour Services is listed by Montalban Tourism and
            Cultural Affairs, giving guests a clearer signal of legitimacy.
          </p>
        </div>
      </div>

      <div className="missionGrid">
        <article className="missionCard">
          <p className="sectionLabel">Mission</p>
          <h3>To make Montalban adventure accessible, guided, and unforgettable.</h3>
          <p>
            We handle the details, support every guest, and create outdoor
            experiences where groups can reconnect, celebrate, and discover what
            Montalban has to offer.
          </p>
        </article>
        <article className="missionCard">
          <p className="sectionLabel">Vision</p>
          <h3>To become a trusted gateway to Rizal's mountain and river adventures.</h3>
          <p>
            We envision Quick Escape as the tour service people remember when
            they want real views, real stories, and a team that treats every
            trip with care.
          </p>
        </article>
      </div>
    </div>
  );
}

function ActivityTab({ activity }: { activity: (typeof activityPages)["river"] }) {
  const Icon = activity.Icon;

  return (
    <div className="activityPage">
      <div className="activityHero">
        <div className="activityCopy">
          <p className="sectionLabel">{activity.eyebrow}</p>
          <h2>{activity.title}</h2>
          <p>{activity.description}</p>
          <blockquote>{activity.promise}</blockquote>
        </div>
        <div className="activityVideo">
          <video src={activity.video} poster={activity.poster} controls playsInline preload="metadata">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="activityDetails">
        <article className="featureCard">
          <Icon aria-hidden="true" />
          <h3>Activities</h3>
          <ul>
            {activity.activities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="featureCard">
          <CheckCircle2 aria-hidden="true" />
          <h3>What guests will feel</h3>
          <ul>
            {activity.fulfillment.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}

function GalleryTab() {
  const [activePhoto, setActivePhoto] = useState(0);
  const [activeVideo, setActiveVideo] = useState(0);
  const selectedPhoto = galleryPhotos[activePhoto];
  const selectedVideo = galleryVideos[activeVideo];

  const showPreviousPhoto = () => {
    setActivePhoto((current) =>
      current === 0 ? galleryPhotos.length - 1 : current - 1,
    );
  };

  const showNextPhoto = () => {
    setActivePhoto((current) =>
      current === galleryPhotos.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div className="galleryTab">
      <div className="sectionHeader">
        <p className="sectionLabel">Real Guest Proof</p>
        <h2>Photos and videos that make the trip feel real.</h2>
      </div>

      <section className="videoShowcase" aria-label="Quick Escape featured videos">
        <div className="featuredVideoFrame">
          <video
            key={selectedVideo.src}
            src={selectedVideo.src}
            poster={selectedVideo.poster}
            controls
            playsInline
            preload="metadata"
          >
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="videoPicker" aria-label="Choose video">
          {galleryVideos.map((video, index) => (
            <button
              key={video.src}
              className={index === activeVideo ? "videoPill active" : "videoPill"}
              type="button"
              onClick={() => setActiveVideo(index)}
            >
              {video.title}
            </button>
          ))}
        </div>
      </section>

      <div className="photoShowcaseGrid">
        <section className="photoCarousel" aria-label="Quick Escape photo gallery">
          <figure className="carouselStage">
            <img src={selectedPhoto.src} alt={selectedPhoto.title} />
            <figcaption>
              <strong>{selectedPhoto.title}</strong>
              {selectedPhoto.caption}
            </figcaption>
          </figure>

          <button
            className="carouselButton previous"
            type="button"
            aria-label="Previous photo"
            onClick={showPreviousPhoto}
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            className="carouselButton next"
            type="button"
            aria-label="Next photo"
            onClick={showNextPhoto}
          >
            <ChevronRight aria-hidden="true" />
          </button>

          <div className="thumbnailRail" aria-label="Choose photo">
            {galleryPhotos.map((photo, index) => (
              <button
                key={photo.src}
                className={index === activePhoto ? "thumbnail active" : "thumbnail"}
                type="button"
                aria-label={`Show ${photo.title}`}
                onClick={() => setActivePhoto(index)}
              >
                <img src={photo.src} alt="" />
              </button>
            ))}
          </div>
        </section>

        <aside className="photoNote">
          <img src={assets.logo} alt="Quick Escape Mountain Tours logo" />
          <h3>Real guests. Real views.</h3>
          <p>
            Use the arrows or thumbnails to browse customer photos, promo proof,
            route highlights, and community presence.
          </p>
        </aside>
      </div>
    </div>
  );
}

function PromoTab() {
  return (
    <div className="promoExperience">
      <div className="promoBanner">
        <img src={assets.promoCollage} alt="Quick Escape summer promo collage" />
        <div>
          <p className="sectionLabel">Summer Promo</p>
          <h2>2500 per day</h2>
          <p className="promoLead">7am to 3pm. Tour guide and gas included.</p>
        </div>
      </div>

      <div className="inclusionsPanel">
        <div>
          <p className="sectionLabel">Inclusions</p>
          <h3>Everything needed for a smooth outdoor day.</h3>
        </div>
        <div className="inclusionsList">
          {[
            "Tour guide assistance",
            "Gas included for the promo ride",
            "Route coordination",
            "Online booking and reservations",
            "Group schedule planning",
            "Photo-worthy stopovers",
          ].map((item) => (
            <span key={item}>
              <CheckCircle2 aria-hidden="true" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="promoActionGrid">
        <article className="promoBox">
          <CalendarCheck aria-hidden="true" />
          <h3>Step 1: Choose your date</h3>
          <p>Pick a target day and message the team early because slots are limited.</p>
        </article>
        <article className="promoBox">
          <Compass aria-hidden="true" />
          <h3>Step 2: Pick the experience</h3>
          <p>Choose ATV adventure, river trekking, mountain tour, or ask for the best route for your group.</p>
        </article>
        <article className="promoBox">
          <Phone aria-hidden="true" />
          <h3>Step 3: Confirm and go</h3>
          <p>Send group size, preferred time, and contact details so Quick Escape can guide the next steps.</p>
        </article>
      </div>

      <div className="promoFooter">
        <CalendarCheck aria-hidden="true" />
        <div>
          <h3>Best for barkada trips, family outings, team bonding, and weekend escapes.</h3>
          <p>Limited slots only. Book while the promo is active.</p>
        </div>
        <a className="solidButton large" href={contact.facebook}>Reserve on Facebook</a>
      </div>
    </div>
  );
}

function ContactTab({ onOpenInquiry }: { onOpenInquiry: () => void }) {
  return (
    <div className="tabGrid">
      <div className="copyBlock">
        <p className="sectionLabel">Book Now</p>
        <h2>Ready for your Montalban escape?</h2>
        <p>
          Send your preferred date, number of guests, and chosen adventure. The
          team will help confirm the details.
        </p>
      </div>
      <aside className="contactCard">
        <h3>Quick Escape Mountain Tours</h3>
        <p>by 29 Sierras Escapade Tour Services</p>
        <ContactLink Icon={Phone} href="tel:09189353692" text={contact.phone} />
        <ContactLink Icon={Mail} href={`mailto:${contact.email}`} text={contact.email} />
        <ContactLink
          Icon={MapPin}
          href="https://www.google.com/maps/search/?api=1&query=Barangay%20Puray%20Rodriguez%20Rizal%20Philippines"
          text={contact.location}
        />
        <button className="solidButton full" type="button" onClick={onOpenInquiry}>
          Inquire About Reservation
        </button>
        <a className="solidButton full" href={contact.facebook}>
          Message on Facebook
        </a>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ContactLink({
  Icon,
  href,
  text,
}: {
  Icon: typeof Phone;
  href: string;
  text: string;
}) {
  return (
    <a className="contactLink" href={href}>
      <Icon aria-hidden="true" />
      <span>{text}</span>
    </a>
  );
}
