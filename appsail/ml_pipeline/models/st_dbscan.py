"""
Lumina — ST-DBSCAN (Spatiotemporal DBSCAN)
Spatiotemporal extension of DBSCAN that clusters crime events by
(latitude, longitude, timestamp) with separate spatial and temporal
distance thresholds.

Reference:
  Birant, D., & Kut, A. (2007). ST-DBSCAN: An algorithm for clustering
  spatial-temporal data. Data & Knowledge Engineering, 60(1), 208-221.
"""

import numpy as np
from sklearn.metrics.pairwise import haversine_distances
from collections import deque


class STDBSCAN:
    """
    Spatiotemporal DBSCAN clustering.

    Parameters:
        eps_spatial: Maximum spatial distance in kilometers between two
                     points for them to be considered neighbors.
        eps_temporal: Maximum temporal distance in days between two
                      events for them to be considered neighbors.
        min_samples: Minimum number of points required to form a cluster.
    """

    def __init__(self, eps_spatial=2.0, eps_temporal=30, min_samples=5):
        self.eps_spatial = eps_spatial
        self.eps_temporal = eps_temporal
        self.min_samples = min_samples
        self.labels_ = None

    def fit(self, points):
        """
        Fit the ST-DBSCAN model to the data.

        Args:
            points: numpy array of shape (n, 3) where columns are
                    [latitude, longitude, timestamp_days].
                    Latitude and longitude are in degrees.
                    Timestamp is in days (e.g., days since epoch).

        Returns:
            self
        """
        n = len(points)
        self.labels_ = np.full(n, -1, dtype=int)  # -1 = noise

        # Precompute spatial distances using Haversine
        coords_rad = np.radians(points[:, :2])
        spatial_dists = haversine_distances(coords_rad) * 6371  # km

        # Temporal distances (absolute difference in days)
        timestamps = points[:, 2]
        temporal_dists = np.abs(
            timestamps[:, np.newaxis] - timestamps[np.newaxis, :]
        )

        cluster_id = 0
        visited = np.zeros(n, dtype=bool)

        for i in range(n):
            if visited[i]:
                continue
            visited[i] = True

            # Find spatiotemporal neighbors
            neighbors = self._get_neighbors(
                i, spatial_dists, temporal_dists
            )

            if len(neighbors) < self.min_samples:
                # Mark as noise (label stays -1)
                continue

            # Start a new cluster
            self.labels_[i] = cluster_id
            seed_set = deque(neighbors)

            while seed_set:
                j = seed_set.popleft()

                if not visited[j]:
                    visited[j] = True
                    j_neighbors = self._get_neighbors(
                        j, spatial_dists, temporal_dists
                    )
                    if len(j_neighbors) >= self.min_samples:
                        seed_set.extend(j_neighbors)

                if self.labels_[j] == -1:
                    self.labels_[j] = cluster_id

            cluster_id += 1

        return self

    def _get_neighbors(self, idx, spatial_dists, temporal_dists):
        """Find all spatiotemporal neighbors of point idx."""
        spatial_mask = spatial_dists[idx] <= self.eps_spatial
        temporal_mask = temporal_dists[idx] <= self.eps_temporal
        combined_mask = spatial_mask & temporal_mask
        combined_mask[idx] = False  # Exclude self
        return np.where(combined_mask)[0].tolist()

    def get_clusters(self, points):
        """
        Get cluster assignments and statistics.

        Args:
            points: Same array used in fit().

        Returns:
            List of dicts with cluster info:
            {
                "cluster_id": int,
                "size": int,
                "centroid_lat": float,
                "centroid_lon": float,
                "date_range": [min_days, max_days],
                "point_indices": [int, ...],
            }
        """
        if self.labels_ is None:
            raise ValueError("Model not fitted. Call fit() first.")

        unique_labels = set(self.labels_)
        unique_labels.discard(-1)  # Remove noise label

        clusters = []
        for label in sorted(unique_labels):
            mask = self.labels_ == label
            cluster_points = points[mask]
            indices = np.where(mask)[0].tolist()

            clusters.append({
                "cluster_id": int(label),
                "size": int(mask.sum()),
                "centroid_lat": float(cluster_points[:, 0].mean()),
                "centroid_lon": float(cluster_points[:, 1].mean()),
                "radius_km": float(self._cluster_radius(cluster_points[:, :2])),
                "date_range": [
                    float(cluster_points[:, 2].min()),
                    float(cluster_points[:, 2].max()),
                ],
                "point_indices": indices,
            })

        return clusters

    @staticmethod
    def _cluster_radius(coords_deg):
        """Calculate the maximum radius of a cluster in km."""
        if len(coords_deg) <= 1:
            return 0.0
        centroid = coords_deg.mean(axis=0)
        coords_rad = np.radians(coords_deg)
        centroid_rad = np.radians(centroid)
        dists = haversine_distances(
            coords_rad, centroid_rad.reshape(1, -1)
        ) * 6371
        return float(dists.max())
